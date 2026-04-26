import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";

const DEFAULT_ROLES = [
	{ code: "employee", name: "Сотрудник", priority: 10 },
	{ code: "support", name: "Поддержка", priority: 20 },
	{ code: "moderator", name: "Модератор", priority: 30 },
	{ code: "company_admin", name: "Администратор компании", priority: 40 },
] as const;

@Injectable()
export class PlatformAdminService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly authService: AuthService,
	) {}

	async listPendingApplications() {
		return this.prisma.companyApplication.findMany({
			where: { status: "pending" },
			orderBy: { created_at: "asc" },
		});
	}

	async approveApplication(id: string, reviewComment?: string) {
		const application = await this.prisma.companyApplication.findUnique({
			where: { id },
		});

		if (!application) {
			throw new NotFoundException("Заявка не найдена");
		}
		if (application.status !== "pending") {
			throw new BadRequestException(
				`Заявка уже имеет статус: ${application.status}`,
			);
		}

		const plan = await this.prisma.plan.findUnique({
			where: { code: application.selected_plan },
		});
		if (!plan) {
			throw new BadRequestException(
				`Тариф ${application.selected_plan} не найден. Сначала выполните prisma:seed.`,
			);
		}

		const contactEmail = application.contact_email.trim().toLowerCase();
		const contactPhone = application.contact_phone.trim();
		const initialPassword = contactEmail;
		const authAccount = await this.authService.ensurePasswordAccount({
			email: contactEmail,
			password: initialPassword,
			firstName: application.contact_first_name,
			lastName: application.contact_last_name,
			phone: contactPhone,
		});

		// Use transaction for atomicity
		return this.prisma.$transaction(async (tx) => {
			// 1. Create Company
			const company = await tx.company.create({
				data: {
					name: application.company_name,
					inn: application.inn,
					contact_email: contactEmail,
					contact_phone: contactPhone,
					contact_first_name: application.contact_first_name,
					contact_last_name: application.contact_last_name,
					contact_patronymic: application.contact_patronymic ?? null,
					subscription_status: "active",
					selected_plan_id: plan.id,
				},
			});

			// 2. Create default roles for company
			const createdRoles: { code: string; id: string }[] = [];
			for (const role of DEFAULT_ROLES) {
				const r = await tx.role.create({
					data: {
						company_id: company.id,
						code: role.code,
						name: role.name,
						priority: role.priority,
						description: `Системная роль: ${role.name}`,
						is_system: true,
					},
				});
				createdRoles.push({ code: r.code, id: r.id });
			}

			const companyAdminRole = createdRoles.find(
				(r) => r.code === "company_admin",
			);
			if (!companyAdminRole) {
				throw new Error("Роль company_admin не была создана");
			}

			// 3. Find or create User by contact_email
			let user = await tx.user.findFirst({
				where: {
					email: {
						equals: contactEmail,
						mode: "insensitive",
					},
				},
			});
			if (user?.supabase_auth_id && user.supabase_auth_id !== authAccount.id) {
				throw new BadRequestException(
					"Этот контактный email уже привязан к другой учётной записи.",
				);
			}

			if (!user) {
				user = await tx.user.create({
					data: {
						supabase_auth_id: authAccount.id,
						email: contactEmail,
						phone_number: contactPhone,
						first_name: application.contact_first_name,
						last_name: application.contact_last_name,
						patronymic: application.contact_patronymic ?? null,
						status: UserStatus.active,
					},
				});
			} else if (user.email !== contactEmail || user.phone_number !== contactPhone) {
				user = await tx.user.update({
					where: { id: user.id },
					data: {
						supabase_auth_id: authAccount.id,
						email: contactEmail,
						phone_number: contactPhone,
					},
				});
			} else if (user.supabase_auth_id !== authAccount.id) {
				user = await tx.user.update({
					where: { id: user.id },
					data: {
						supabase_auth_id: authAccount.id,
					},
				});
			}

			// 4. Create Membership with company_admin role
			await tx.membership.create({
				data: {
					company_id: company.id,
					user_id: user.id,
					role_id: companyAdminRole.id,
					status: "active",
					is_default_company: true,
				},
			});

			// 5. Update application status
			await tx.companyApplication.update({
				where: { id },
				data: {
					status: "approved",
					review_comment: reviewComment ?? null,
					updated_at: new Date(),
				},
			});

			return {
				application: await tx.companyApplication.findUnique({
					where: { id },
				}),
				company,
				user,
				authAccount: {
					email: authAccount.email,
					created: authAccount.created,
					initialPassword: authAccount.created ? initialPassword : null,
				},
			};
		});
	}

	async rejectApplication(id: string, reviewComment?: string) {
		const application = await this.prisma.companyApplication.findUnique({
			where: { id },
		});

		if (!application) {
			throw new NotFoundException("Заявка не найдена");
		}
		if (application.status !== "pending") {
			throw new BadRequestException(
				`Заявка уже имеет статус: ${application.status}`,
			);
		}

		return this.prisma.companyApplication.update({
			where: { id },
			data: {
				status: "rejected",
				review_comment: reviewComment ?? null,
				updated_at: new Date(),
			},
		});
	}
}
