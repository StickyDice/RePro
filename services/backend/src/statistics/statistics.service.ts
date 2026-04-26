import { ForbiddenException, Injectable } from "@nestjs/common";
import { RentalRequestStatus } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { TenantContextService } from "@/tenant-context/tenant-context.service";

@Injectable()
export class StatisticsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly tenantContext: TenantContextService,
	) {}

	private assertCompanyContext(companyId: string): void {
		const contextCompanyId = this.tenantContext.getCompanyId();
		if (contextCompanyId !== companyId) {
			throw new ForbiddenException(
				"ID компании в пути не совпадает с активным контекстом компании",
			);
		}
	}

	private toDateRange(startDate: string, endDate: string): {
		start: Date;
		end: Date;
		periodMs: number;
	} {
		const start = new Date(startDate);
		start.setUTCHours(0, 0, 0, 0);
		const end = new Date(endDate);
		end.setUTCHours(23, 59, 59, 999);
		const periodMs = end.getTime() - start.getTime() + 1;
		return { start, end, periodMs };
	}

	async getOverview(
		companyId: string,
		startDate: string,
		endDate: string,
	): Promise<{
		totalResources: number;
		totalRentalsInPeriod: number;
		approvedCount: number;
		rejectedCount: number;
		uniqueUsers: number;
	}> {
		this.assertCompanyContext(companyId);
		const { start, end } = this.toDateRange(startDate, endDate);

		const whereRentalsInPeriod = {
			company_id: companyId,
			created_at: { gte: start, lte: end },
		};

		const [totalResources, totalRentalsInPeriod, approvedCount, rejectedCount, uniqueUserIds] =
			await Promise.all([
				this.prisma.resource.count({
					where: { company_id: companyId, is_active: true },
				}),
				this.prisma.rentalRequest.count({
					where: whereRentalsInPeriod,
				}),
				this.prisma.rentalRequest.count({
					where: {
						...whereRentalsInPeriod,
						status: RentalRequestStatus.approved,
					},
				}),
				this.prisma.rentalRequest.count({
					where: {
						...whereRentalsInPeriod,
						status: RentalRequestStatus.rejected,
					},
				}),
				this.prisma.rentalRequest.findMany({
					where: whereRentalsInPeriod,
					select: { user_id: true },
					distinct: ["user_id"],
				}),
			]);

		return {
			totalResources,
			totalRentalsInPeriod,
			approvedCount,
			rejectedCount,
			uniqueUsers: uniqueUserIds.length,
		};
	}

	async getResourcesStats(
		companyId: string,
		startDate: string,
		endDate: string,
		resourceId?: string,
		category?: string,
	): Promise<{
		resourceUtilization: Array<{
			resourceId: string;
			resourceName: string;
			resourceCode: string;
			category: string | null;
			loadPercent: number;
			totalRentals: number;
		}>;
		topRentedResources: Array<{
			resourceId: string;
			resourceName: string;
			resourceCode: string;
			rentalCount: number;
		}>;
	}> {
		this.assertCompanyContext(companyId);
		const { start, end, periodMs } = this.toDateRange(startDate, endDate);

		const resourceWhere: {
			company_id: string;
			is_active: boolean;
			id?: string;
			category?: string;
		} = {
			company_id: companyId,
			is_active: true,
		};
		if (resourceId) resourceWhere.id = resourceId;
		if (category) resourceWhere.category = category;

		const resources = await this.prisma.resource.findMany({
			where: resourceWhere,
			include: {
				rental_allocations: {
					where: {
						rental_request: { status: RentalRequestStatus.approved },
						start_at: { lte: end },
						end_at: { gte: start },
					},
				},
			},
		});

		const periodResourceHours = periodMs / (1000 * 60 * 60);

		const resourceUtilization = resources.map((r) => {
			let usedResourceHours = 0;
			for (const a of r.rental_allocations) {
				const overlapStart = new Date(
					Math.max(a.start_at.getTime(), start.getTime()),
				);
				const overlapEnd = new Date(
					Math.min(a.end_at.getTime(), end.getTime()),
				);
				const overlapHours =
					(overlapEnd.getTime() - overlapStart.getTime()) /
					(1000 * 60 * 60);
				usedResourceHours += overlapHours * a.quantity_reserved;
			}
			const capacity =
				periodResourceHours * Math.max(1, r.quantity_active);
			const loadPercent =
				capacity > 0
					? Math.min(100, (usedResourceHours / capacity) * 100)
					: 0;

			return {
				resourceId: r.id,
				resourceName: r.name,
				resourceCode: r.code,
				category: r.category,
				loadPercent: Math.round(loadPercent * 100) / 100,
				totalRentals: r.rental_allocations.length,
			};
		});

		const topRentedResources = [...resourceUtilization]
			.sort((a, b) => b.totalRentals - a.totalRentals)
			.slice(0, 10)
			.map(({ resourceId, resourceName, resourceCode, totalRentals }) => ({
				resourceId,
				resourceName,
				resourceCode,
				rentalCount: totalRentals,
			}));

		return { resourceUtilization, topRentedResources };
	}

	async getRentalsStats(
		companyId: string,
		startDate: string,
		endDate: string,
	): Promise<{
		rentalsByStatus: Array<{ status: string; count: number }>;
		peakDemandPeriods: Array<{
			date: string;
			count: number;
		}>;
	}> {
		this.assertCompanyContext(companyId);
		const { start, end } = this.toDateRange(startDate, endDate);

		const whereRentals = {
			company_id: companyId,
			created_at: { gte: start, lte: end },
		};

		const [byStatus, rentals] = await Promise.all([
			this.prisma.rentalRequest.groupBy({
				by: ["status"],
				where: whereRentals,
				_count: { id: true },
			}),
			this.prisma.rentalRequest.findMany({
				where: {
					...whereRentals,
					status: RentalRequestStatus.approved,
				},
				select: { requested_start_at: true },
			}),
		]);

		const rentalsByStatus = byStatus.map((g) => ({
			status: g.status,
			count: g._count.id,
		}));

		const dateCounts = new Map<string, number>();
		for (const r of rentals) {
			const d = new Date(r.requested_start_at);
			const key = d.toISOString().slice(0, 10);
			dateCounts.set(key, (dateCounts.get(key) ?? 0) + 1);
		}

		const peakDemandPeriods = [...dateCounts.entries()]
			.map(([date, count]) => ({ date, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		return { rentalsByStatus, peakDemandPeriods };
	}
}
