import {
	Body,
	Controller,
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
import { AddMemberDto } from "./dto/add-member.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";
import { UpdateMemberStatusDto } from "./dto/update-member-status.dto";

@Controller("companies/:companyId/members")
@UseGuards(AuthGuard, TenantGuard, RoleGuard)
@MinRolePriority(ROLE_PRIORITIES.moderator)
export class MembersController {
	constructor(private readonly companiesService: CompaniesService) {}

	@Get()
	async getMembers(@Param("companyId") companyId: string) {
		const members = await this.companiesService.getMembers(companyId);
		return { members };
	}

	@Post()
	async addMember(
		@Param("companyId") companyId: string,
		@Body() dto: AddMemberDto,
	) {
		return this.companiesService.addMember(companyId, dto);
	}

	@Patch(":membershipId")
	async updateMemberRole(
		@Param("companyId") companyId: string,
		@Param("membershipId") membershipId: string,
		@Body() dto: UpdateMemberRoleDto,
	) {
		return this.companiesService.updateMemberRole(
			companyId,
			membershipId,
			dto.role_id,
		);
	}

	@Patch(":membershipId/status")
	async updateMemberStatus(
		@Param("companyId") companyId: string,
		@Param("membershipId") membershipId: string,
		@Body() dto: UpdateMemberStatusDto,
	) {
		return this.companiesService.updateMemberStatus(
			companyId,
			membershipId,
			dto.status,
		);
	}
}
