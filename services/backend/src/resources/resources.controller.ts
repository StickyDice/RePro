import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import type { RequestUser } from "@/auth/types";
import { User } from "@/auth/user.decorator";
import { MinRolePriority, RoleGuard, TenantGuard } from "@/guards";
import { ROLE_PRIORITIES } from "@/guards/min-role-priority.decorator";
import { AvailabilityQueryDto } from "./dto/availability-query.dto";
import { CreateResourceExceptionDto } from "./dto/create-exception.dto";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
import { ResourcesService } from "./resources.service";

@Controller("companies/:companyId/resources")
@UseGuards(AuthGuard, TenantGuard)
export class ResourcesController {
	constructor(private readonly resourcesService: ResourcesService) {}

	@Get()
	async listResources(@Param("companyId", ParseUUIDPipe) companyId: string) {
		return this.resourcesService.listResources(companyId);
	}

	@Post()
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.moderator)
	async createResource(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Body() dto: CreateResourceDto,
		@User() user: RequestUser,
	) {
		return this.resourcesService.createResource(companyId, dto, user.id);
	}

	@Get(":resourceId")
	async getResource(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("resourceId", ParseUUIDPipe) resourceId: string,
	) {
		return this.resourcesService.getResource(companyId, resourceId);
	}

	@Patch(":resourceId")
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.moderator)
	async updateResource(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("resourceId", ParseUUIDPipe) resourceId: string,
		@Body() dto: UpdateResourceDto,
		@User() user: RequestUser,
	) {
		return this.resourcesService.updateResource(
			companyId,
			resourceId,
			dto,
			user.id,
		);
	}

	@Delete(":resourceId")
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.moderator)
	async deleteResource(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("resourceId", ParseUUIDPipe) resourceId: string,
	) {
		return this.resourcesService.deleteResource(companyId, resourceId);
	}

	@Get(":resourceId/availability")
	async getAvailability(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("resourceId", ParseUUIDPipe) resourceId: string,
		@Query() query: AvailabilityQueryDto,
	) {
		return this.resourcesService.getAvailability(
			companyId,
			resourceId,
			query.startDate,
			query.endDate,
		);
	}

	@Get(":resourceId/exceptions")
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.moderator)
	async listExceptions(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("resourceId", ParseUUIDPipe) resourceId: string,
	) {
		return this.resourcesService.listExceptions(companyId, resourceId);
	}

	@Post(":resourceId/exceptions")
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.moderator)
	async createException(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("resourceId", ParseUUIDPipe) resourceId: string,
		@Body() dto: CreateResourceExceptionDto,
	) {
		return this.resourcesService.createException(companyId, resourceId, {
			user_id: dto.user_id,
			rule_type: dto.rule_type,
			reason: dto.reason,
		});
	}

	@Delete(":resourceId/exceptions/:exceptionId")
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.moderator)
	async deleteException(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("resourceId", ParseUUIDPipe) resourceId: string,
		@Param("exceptionId", ParseUUIDPipe) exceptionId: string,
	) {
		return this.resourcesService.deleteException(
			companyId,
			resourceId,
			exceptionId,
		);
	}
}
