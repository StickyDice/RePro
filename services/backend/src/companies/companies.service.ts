import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { MembershipStatus } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import type { AddMemberDto } from "./dto/add-member.dto";
import type { CreateRoleDto } from "./dto/create-role.dto";
import type { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class CompaniesService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Get user's companies (memberships with company, role).
	 */
	async getMyCompanies(userId: string) {
		const memberships = await this.prisma.membership.findMany({
			where: { user_id: userId },
			include: {
				company: { select: { id: true, name: true, inn: true } },
				role: { select: { id: true, name: true, code: true } },
			},
		});
		return memberships.map((m) => ({
			membership_id: m.id,
			company: m.company,
			role: m.role,
			status: m.status,
			is_default_company: m.is_default_company,
		}));
	}

	/**
	 * Get company details by ID.
	 */
	async getCompany(companyId: string) {
		const company = await this.prisma.company.findUnique({
			where: { id: companyId },
			include: {
				selected_plan: { select: { code: true, name: true } },
			},
		});
		if (!company) {
			throw new NotFoundException("Компания не найдена");
		}
		return company;
	}

	/**
	 * List members with roles.
	 */
	async getMembers(companyId: string) {
		const members = await this.prisma.membership.findMany({
			where: { company_id: companyId },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						phone_number: true,
						first_name: true,
						last_name: true,
						patronymic: true,
					},
				},
				role: { select: { id: true, name: true, code: true } },
			},
		});
		return members.map((m) => ({
			id: m.id,
			user: m.user,
			role: m.role,
			status: m.status,
		}));
	}

	/**
	 * Add member: find user by email/phone, or create user, then create membership.
	 */
	async addMember(companyId: string, dto: AddMemberDto) {
		await this.ensureRoleBelongsToCompany(companyId, dto.role_id);

		let user = await this.prisma.user.findFirst({
			where: {
				OR: [
					...(dto.email ? [{ email: dto.email.trim() }] : []),
					...(dto.phone ? [{ phone_number: dto.phone.trim() }] : []),
				],
			},
		});

		if (!user) {
			user = await this.prisma.user.create({
				data: {
					email: dto.email.trim() || null,
					phone_number: dto.phone?.trim() || null,
					first_name: dto.first_name ?? null,
					last_name: dto.last_name ?? null,
					patronymic: dto.patronymic ?? null,
				},
			});
		}

		const existing = await this.prisma.membership.findUnique({
			where: {
				company_id_user_id: { company_id: companyId, user_id: user.id },
			},
		});
		if (existing) {
			throw new ConflictException("Пользователь уже состоит в этой компании");
		}

		const isNewUser = !user.supabase_auth_id;
		const status: MembershipStatus = isNewUser ? "invited" : "active";

		const membership = await this.prisma.membership.create({
			data: {
				company_id: companyId,
				user_id: user.id,
				role_id: dto.role_id,
				status,
			},
			include: {
				user: {
					select: {
						id: true,
						email: true,
						phone_number: true,
						first_name: true,
						last_name: true,
						patronymic: true,
					},
				},
				role: { select: { id: true, name: true, code: true } },
			},
		});

		if (isNewUser) {
			this.sendInviteEmailStub(dto.email, user.id, companyId);
		}

		return membership;
	}

	/**
	 * Update member's role.
	 */
	async updateMemberRole(
		companyId: string,
		membershipId: string,
		roleId: string,
	) {
		await this.ensureRoleBelongsToCompany(companyId, roleId);

		const membership = await this.prisma.membership.findFirst({
			where: { id: membershipId, company_id: companyId },
		});
		if (!membership) {
			throw new NotFoundException("Связь с компанией не найдена");
		}

		return this.prisma.membership.update({
			where: { id: membershipId },
			data: { role_id: roleId },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						phone_number: true,
						first_name: true,
						last_name: true,
						patronymic: true,
					},
				},
				role: { select: { id: true, name: true, code: true } },
			},
		});
	}

	/**
	 * Update member's status (active, blocked).
	 */
	async updateMemberStatus(
		companyId: string,
		membershipId: string,
		status: "active" | "blocked",
	) {
		const membership = await this.prisma.membership.findFirst({
			where: { id: membershipId, company_id: companyId },
		});
		if (!membership) {
			throw new NotFoundException("Связь с компанией не найдена");
		}

		return this.prisma.membership.update({
			where: { id: membershipId },
			data: { status },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						phone_number: true,
						first_name: true,
						last_name: true,
						patronymic: true,
					},
				},
				role: { select: { id: true, name: true, code: true } },
			},
		});
	}

	/**
	 * List roles for a company.
	 */
	async getRoles(companyId: string) {
		return this.prisma.role.findMany({
			where: { company_id: companyId },
			orderBy: { priority: "desc" },
		});
	}

	/**
	 * Create a new role. Requires company_admin.
	 */
	async createRole(companyId: string, dto: CreateRoleDto) {
		const code = dto.code.trim().toLowerCase();
		const existing = await this.prisma.role.findUnique({
			where: {
				company_id_code: { company_id: companyId, code },
			},
		});
		if (existing) {
			throw new ConflictException(`Роль с кодом '${code}' уже существует`);
		}

		return this.prisma.role.create({
			data: {
				company_id: companyId,
				name: dto.name.trim(),
				code,
				priority: dto.priority,
				description: dto.description?.trim() ?? null,
				is_system: false,
			},
		});
	}

	/**
	 * Update a role.
	 */
	async updateRole(companyId: string, roleId: string, dto: UpdateRoleDto) {
		const role = await this.prisma.role.findFirst({
			where: { id: roleId, company_id: companyId },
		});
		if (!role) {
			throw new NotFoundException("Роль не найдена");
		}

		if (dto.code !== undefined) {
			const code = dto.code.trim().toLowerCase();
			const existing = await this.prisma.role.findFirst({
				where: {
					company_id: companyId,
					code,
					id: { not: roleId },
				},
			});
			if (existing) {
				throw new ConflictException(`Роль с кодом '${code}' уже существует`);
			}
		}

		return this.prisma.role.update({
			where: { id: roleId },
			data: {
				...(dto.name !== undefined && { name: dto.name.trim() }),
				...(dto.code !== undefined && {
					code: dto.code.trim().toLowerCase(),
				}),
				...(dto.priority !== undefined && { priority: dto.priority }),
				...(dto.description !== undefined && {
					description: dto.description?.trim() ?? null,
				}),
			},
		});
	}

	/**
	 * Delete a role. Only if not in use and not system role.
	 */
	async deleteRole(companyId: string, roleId: string) {
		const role = await this.prisma.role.findFirst({
			where: { id: roleId, company_id: companyId },
			include: { _count: { select: { memberships: true } } },
		});
		if (!role) {
			throw new NotFoundException("Роль не найдена");
		}
		if (role.is_system) {
			throw new BadRequestException("Нельзя удалить системную роль");
		}
		if (role._count.memberships > 0) {
			throw new BadRequestException(
				"Нельзя удалить роль, которая назначена сотрудникам",
			);
		}

		await this.prisma.role.delete({ where: { id: roleId } });
		return { ok: true };
	}

	private async ensureRoleBelongsToCompany(
		companyId: string,
		roleId: string,
	): Promise<void> {
		const role = await this.prisma.role.findFirst({
			where: { id: roleId, company_id: companyId },
		});
		if (!role) {
			throw new BadRequestException(
				"Роль не найдена или не принадлежит компании",
			);
		}
	}

	/**
	 * Stub for invite email. TODO: integrate with queue/email service.
	 */
	private sendInviteEmailStub(
		_email: string,
		_userId: string,
		_companyId: string,
	): void {
		// TODO: Queue invite email
	}
}
