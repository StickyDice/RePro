import {
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Query,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { MinRolePriority, RoleGuard, TenantGuard } from "@/guards";
import { ROLE_PRIORITIES } from "@/guards/min-role-priority.decorator";
import { StatisticsResourcesQueryDto } from "./dto/statistics-query.dto";
import { StatisticsService } from "./statistics.service";

@Controller("companies/:companyId/statistics")
@UseGuards(AuthGuard, TenantGuard, RoleGuard)
@MinRolePriority(ROLE_PRIORITIES.moderator)
export class StatisticsController {
	constructor(private readonly statisticsService: StatisticsService) {}

	@Get("overview")
	async getOverview(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Query() query: StatisticsResourcesQueryDto,
	) {
		return this.statisticsService.getOverview(
			companyId,
			query.startDate,
			query.endDate,
		);
	}

	@Get("resources")
	async getResourcesStats(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Query() query: StatisticsResourcesQueryDto,
	) {
		return this.statisticsService.getResourcesStats(
			companyId,
			query.startDate,
			query.endDate,
			query.resourceId,
			query.category,
		);
	}

	@Get("rentals")
	async getRentalsStats(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Query() query: StatisticsResourcesQueryDto,
	) {
		return this.statisticsService.getRentalsStats(
			companyId,
			query.startDate,
			query.endDate,
		);
	}
}
