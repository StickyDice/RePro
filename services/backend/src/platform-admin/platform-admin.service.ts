import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

const DEFAULT_ROLES = [
	{ code: "employee", name: "Employee", priority: 10 },
	{ code: "support", name: "Support", priority: 20 },
	{ code: "moderator", name: "Moderator", priority: 30 },
	{ code: "company_admin", name: "Company Admin", priority: 40 },
] as const;

@Injectable()
export class PlatformAdminService {
	constructor(private readonly prisma: PrismaService) {}

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
			throw new NotFoundException("Application not found");
		}
		if (application.status !== "pending") {
			throw new BadRequestException(
				`Application is already ${application.status}`,
			);
		}

		const plan = await this.prisma.plan.findUnique({
			where: { code: application.selected_plan },
		});
		if (!plan) {
			throw new BadRequestException(
				`Plan ${application.selected_plan} not found. Run prisma:seed first.`,
			);
		}

		// Use transaction for atomicity
		return this.prisma.$transaction(async (tx) => {
			// 1. Create Company
			const company = await tx.company.create({
				data: {
					name: application.company_name,
					inn: application.inn,
					contact_email: application.contact_email,
					contact_phone: application.contact_phone,
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
						description: `Default ${role.name} role`,
						is_system: true,
					},
				});
				createdRoles.push({ code: r.code, id: r.id });
			}

			const companyAdminRole = createdRoles.find(
				(r) => r.code === "company_admin",
			);
			if (!companyAdminRole) {
				throw new Error("company_admin role was not created");
			}

			// 3. Find or create User by contact_email
			let user = await tx.user.findUnique({
				where: { email: application.contact_email },
			});

			if (!user) {
				user = await tx.user.create({
					data: {
						email: application.contact_email,
						phone_number: application.contact_phone,
						first_name: application.contact_first_name,
						last_name: application.contact_last_name,
						patronymic: application.contact_patronymic ?? null,
						status: UserStatus.active,
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
			};
		});
	}

	async rejectApplication(id: string, reviewComment?: string) {
		const application = await this.prisma.companyApplication.findUnique({
			where: { id },
		});

		if (!application) {
			throw new NotFoundException("Application not found");
		}
		if (application.status !== "pending") {
			throw new BadRequestException(
				`Application is already ${application.status}`,
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
