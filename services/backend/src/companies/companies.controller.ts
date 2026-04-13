import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import type { RequestUser } from "@/auth/types";
import { User } from "@/auth/user.decorator";
import { TenantGuard } from "@/guards/tenant.guard";
import { CompaniesService } from "./companies.service";

@Controller("companies")
export class CompaniesController {
	constructor(private readonly companiesService: CompaniesService) {}

	/**
	 * Get current user's companies (memberships with company, role).
	 * Must be defined before :companyId to avoid "my" being captured as companyId.
	 */
	@Get("my")
	@UseGuards(AuthGuard)
	async getMyCompanies(@User() user: RequestUser) {
		const companies = await this.companiesService.getMyCompanies(user.id);
		return { companies };
	}

	/**
	 * Get company details. Requires membership in company.
	 */
	@Get(":companyId")
	@UseGuards(AuthGuard, TenantGuard)
	async getCompany(@Param("companyId") companyId: string) {
		return this.companiesService.getCompany(companyId);
	}
}
