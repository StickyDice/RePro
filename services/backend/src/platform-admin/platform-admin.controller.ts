import {
	Body,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Patch,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { PlatformAdminGuard } from "@/guards/platform-admin.guard";
import { ApproveApplicationDto } from "./dto/approve-application.dto";
import { RejectApplicationDto } from "./dto/reject-application.dto";
import { PlatformAdminService } from "./platform-admin.service";

@Controller("platform")
@UseGuards(AuthGuard, PlatformAdminGuard)
export class PlatformAdminController {
	constructor(private readonly platformAdminService: PlatformAdminService) {}

	/**
	 * List pending company applications.
	 */
	@Get("company-applications")
	async listApplications() {
		const applications =
			await this.platformAdminService.listPendingApplications();
		return { applications };
	}

	/**
	 * Approve a company application. Creates Company, User (if needed), default roles, and Membership.
	 */
	@Patch("company-applications/:id/approve")
	async approveApplication(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: ApproveApplicationDto,
	) {
		const result = await this.platformAdminService.approveApplication(
			id,
			dto.review_comment,
		);
		return result;
	}

	/**
	 * Reject a company application.
	 */
	@Patch("company-applications/:id/reject")
	async rejectApplication(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: RejectApplicationDto,
	) {
		const application = await this.platformAdminService.rejectApplication(
			id,
			dto.review_comment,
		);
		return { application };
	}
}
