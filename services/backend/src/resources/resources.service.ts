import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { RentalRequestStatus } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { TenantContextService } from "@/tenant-context/tenant-context.service";
import type { CreateResourceDto } from "./dto/create-resource.dto";
import type { UpdateResourceDto } from "./dto/update-resource.dto";
import { ResourceAccessService } from "./resource-access.service";

@Injectable()
export class ResourcesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly tenantContext: TenantContextService,
		private readonly resourceAccess: ResourceAccessService,
	) {}

	private getCompanyId(): string {
		return this.tenantContext.requireCompanyId();
	}

	private getUserId(): string {
		return this.tenantContext.requireUserId();
	}

	async listResources(companyId: string) {
		this.assertCompanyContext(companyId);

		const userId = this.getUserId();
		const resources = await this.prisma.resource.findMany({
			where: { company_id: companyId, is_active: true },
			include: { min_role: true },
		});

		const accessible: typeof resources = [];
		for (const resource of resources) {
			const canAccess = await this.resourceAccess.canUserAccessResource(
				userId,
				resource.id,
				companyId,
			);
			if (canAccess) {
				accessible.push(resource);
			}
		}

		return { resources: accessible };
	}

	async createResource(
		companyId: string,
		dto: CreateResourceDto,
		userId: string,
	) {
		this.assertCompanyContext(companyId);

		const quantityActive = dto.quantity_active ?? dto.quantity_total;

		const resource = await this.prisma.resource.create({
			data: {
				company_id: companyId,
				name: dto.name,
				code: dto.code,
				description: dto.description ?? null,
				category: dto.category ?? null,
				quantity_total: dto.quantity_total,
				quantity_active: quantityActive,
				min_role_id: dto.min_role_id ?? null,
				created_by: userId,
				updated_by: userId,
			},
			include: { min_role: true },
		});

		return { resource };
	}

	async getResource(companyId: string, resourceId: string) {
		this.assertCompanyContext(companyId);

		const userId = this.getUserId();
		const resource = await this.prisma.resource.findFirst({
			where: { id: resourceId, company_id: companyId },
			include: { min_role: true },
		});

		if (!resource) {
			throw new NotFoundException("Ресурс не найден");
		}

		if (!resource.is_active) {
			throw new NotFoundException("Ресурс не найден");
		}

		const canAccess = await this.resourceAccess.canUserAccessResource(
			userId,
			resourceId,
			companyId,
		);
		if (!canAccess) {
			throw new ForbiddenException("У вас нет доступа к этому ресурсу");
		}

		return { resource };
	}

	async updateResource(
		companyId: string,
		resourceId: string,
		dto: UpdateResourceDto,
		userId: string,
	) {
		this.assertCompanyContext(companyId);

		const resource = await this.prisma.resource.findFirst({
			where: { id: resourceId, company_id: companyId },
		});

		if (!resource) {
			throw new NotFoundException("Ресурс не найден");
		}

		const updated = await this.prisma.resource.update({
			where: { id: resourceId },
			data: {
				...(dto.name !== undefined && { name: dto.name }),
				...(dto.code !== undefined && { code: dto.code }),
				...(dto.description !== undefined && { description: dto.description }),
				...(dto.category !== undefined && { category: dto.category }),
				...(dto.quantity_total !== undefined && {
					quantity_total: dto.quantity_total,
				}),
				...(dto.quantity_active !== undefined && {
					quantity_active: dto.quantity_active,
				}),
				...(dto.min_role_id !== undefined && {
					min_role_id: dto.min_role_id,
				}),
				updated_by: userId,
			},
			include: { min_role: true },
		});

		return { resource: updated };
	}

	async deleteResource(companyId: string, resourceId: string) {
		this.assertCompanyContext(companyId);

		const resource = await this.prisma.resource.findFirst({
			where: { id: resourceId, company_id: companyId },
		});

		if (!resource) {
			throw new NotFoundException("Ресурс не найден");
		}

		await this.prisma.resource.update({
			where: { id: resourceId },
			data: { is_active: false },
		});

		return { success: true };
	}

	async getAvailability(
		companyId: string,
		resourceId: string,
		startDate: string,
		endDate: string,
	) {
		this.assertCompanyContext(companyId);

		const userId = this.getUserId();
		const resource = await this.prisma.resource.findFirst({
			where: { id: resourceId, company_id: companyId, is_active: true },
		});

		if (!resource) {
			throw new NotFoundException("Ресурс не найден");
		}

		const canAccess = await this.resourceAccess.canUserAccessResource(
			userId,
			resourceId,
			companyId,
		);
		if (!canAccess) {
			throw new ForbiddenException("У вас нет доступа к этому ресурсу");
		}

		const quantityActive = resource.quantity_active;

		const start = new Date(startDate);
		start.setUTCHours(0, 0, 0, 0);
		const end = new Date(endDate);
		end.setUTCHours(23, 59, 59, 999);

		const allocations = await this.prisma.rentalAllocation.findMany({
			where: {
				resource_id: resourceId,
				rental_request: { status: RentalRequestStatus.approved },
				start_at: { lte: end },
				end_at: { gte: start },
			},
		});

		const availability: Record<string, number> = {};
		const current = new Date(start);
		const lastDate = new Date(end);

		while (current <= lastDate) {
			const dayStart = new Date(current);
			dayStart.setUTCHours(0, 0, 0, 0);
			const dayEnd = new Date(current);
			dayEnd.setUTCHours(23, 59, 59, 999);

			let reserved = 0;
			for (const a of allocations) {
				const aStart = new Date(a.start_at);
				const aEnd = new Date(a.end_at);
				if (aStart <= dayEnd && aEnd >= dayStart) {
					reserved += a.quantity_reserved;
				}
			}

			const available = Math.max(0, quantityActive - reserved);
			const dateKey = current.toISOString().slice(0, 10);
			availability[dateKey] = available;

			current.setUTCDate(current.getUTCDate() + 1);
		}

		return { availability };
	}

	/**
	 * Check if resource has at least 1 unit available for every day in the date range.
	 * Used when creating rental requests and approving them.
	 * @param db - Optional transaction client for use within $transaction (race-condition safety)
	 */
	async checkResourceAvailableForRange(
		companyId: string,
		resourceId: string,
		startAt: Date,
		endAt: string | Date,
		db?: Pick<PrismaService, "resource" | "rentalAllocation">,
	): Promise<boolean> {
		const prisma = db ?? this.prisma;

		const resource = await prisma.resource.findFirst({
			where: { id: resourceId, company_id: companyId, is_active: true },
		});

		if (!resource) {
			return false;
		}

		const start = new Date(startAt);
		start.setUTCHours(0, 0, 0, 0);
		const end = new Date(endAt);
		end.setUTCHours(23, 59, 59, 999);

		const allocations = await prisma.rentalAllocation.findMany({
			where: {
				resource_id: resourceId,
				rental_request: { status: RentalRequestStatus.approved },
				start_at: { lte: end },
				end_at: { gte: start },
			},
		});

		const quantityActive = resource.quantity_active;
		const current = new Date(start);
		const lastDate = new Date(end);

		while (current <= lastDate) {
			const dayStart = new Date(current);
			dayStart.setUTCHours(0, 0, 0, 0);
			const dayEnd = new Date(current);
			dayEnd.setUTCHours(23, 59, 59, 999);

			let reserved = 0;
			for (const a of allocations) {
				const aStart = new Date(a.start_at);
				const aEnd = new Date(a.end_at);
				if (aStart <= dayEnd && aEnd >= dayStart) {
					reserved += a.quantity_reserved;
				}
			}

			const available = quantityActive - reserved;
			if (available < 1) {
				return false;
			}

			current.setUTCDate(current.getUTCDate() + 1);
		}

		return true;
	}

	async listExceptions(companyId: string, resourceId: string) {
		this.assertCompanyContext(companyId);

		const resource = await this.prisma.resource.findFirst({
			where: { id: resourceId, company_id: companyId },
		});

		if (!resource) {
			throw new NotFoundException("Ресурс не найден");
		}

		const exceptions = await this.prisma.resourceUserException.findMany({
			where: { resource_id: resourceId, company_id: companyId },
			include: { user: true },
		});

		return { exceptions };
	}

	async createException(
		companyId: string,
		resourceId: string,
		dto: { user_id: string; rule_type: "allow" | "deny"; reason?: string },
	) {
		this.assertCompanyContext(companyId);

		const resource = await this.prisma.resource.findFirst({
			where: { id: resourceId, company_id: companyId },
		});

		if (!resource) {
			throw new NotFoundException("Ресурс не найден");
		}

		const exception = await this.prisma.resourceUserException.create({
			data: {
				company_id: companyId,
				resource_id: resourceId,
				user_id: dto.user_id,
				rule_type: dto.rule_type,
				reason: dto.reason ?? null,
			},
			include: { user: true },
		});

		return { exception };
	}

	async deleteException(
		companyId: string,
		resourceId: string,
		exceptionId: string,
	) {
		this.assertCompanyContext(companyId);

		const exception = await this.prisma.resourceUserException.findFirst({
			where: {
				id: exceptionId,
				resource_id: resourceId,
				company_id: companyId,
			},
		});

		if (!exception) {
			throw new NotFoundException("Исключение не найдено");
		}

		await this.prisma.resourceUserException.delete({
			where: { id: exceptionId },
		});

		return { success: true };
	}

	private assertCompanyContext(companyId: string): void {
		const contextCompanyId = this.tenantContext.getCompanyId();
		if (contextCompanyId !== companyId) {
			throw new ForbiddenException(
				"ID компании в пути не совпадает с активным контекстом компании",
			);
		}
	}
}
