import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { MinRolePriority, ROLE_PRIORITIES } from "@/guards";
import { RoleGuard } from "@/guards/role.guard";
import { TenantGuard } from "@/guards/tenant.guard";
import { CompaniesService } from "./companies.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Controller("companies/:companyId/roles")
@UseGuards(AuthGuard, TenantGuard)
export class RolesController {
	constructor(private readonly companiesService: CompaniesService) {}

	@Get()
	async getRoles(@Param("companyId") companyId: string) {
		const roles = await this.companiesService.getRoles(companyId);
		return { roles };
	}

	@Post()
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.company_admin)
	async createRole(
		@Param("companyId") companyId: string,
		@Body() dto: CreateRoleDto,
	) {
		return this.companiesService.createRole(companyId, dto);
	}

	@Patch(":roleId")
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.company_admin)
	async updateRole(
		@Param("companyId") companyId: string,
		@Param("roleId") roleId: string,
		@Body() dto: UpdateRoleDto,
	) {
		return this.companiesService.updateRole(companyId, roleId, dto);
	}

	@Delete(":roleId")
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.company_admin)
	async deleteRole(
		@Param("companyId") companyId: string,
		@Param("roleId") roleId: string,
	) {
		return this.companiesService.deleteRole(companyId, roleId);
	}
}
