import { Body, Controller, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "@/auth/auth.service";
import { CompanyApplicationsService } from "./company-applications.service";
import { CreateCompanyApplicationDto } from "./dto/create-company-application.dto";

@Controller("company-applications")
export class CompanyApplicationsController {
	constructor(
		private readonly companyApplicationsService: CompanyApplicationsService,
		private readonly authService: AuthService,
	) {}

	/**
	 * Create a company application. Public endpoint, no auth required.
	 */
	@Post()
	async create(@Req() req: Request, @Body() dto: CreateCompanyApplicationDto) {
		let authenticatedEmail: string | null = null;
		const authHeader = req.headers.authorization;
		if (authHeader?.startsWith("Bearer ")) {
			const supabaseUser = await this.authService.verifyToken(authHeader.slice(7));
			if (supabaseUser) {
				await this.authService.syncUserFromSupabase(supabaseUser);
				authenticatedEmail = supabaseUser.email?.trim().toLowerCase() ?? null;
			}
		}

		const application = await this.companyApplicationsService.create({
			company_name: dto.company_name,
			inn: dto.inn,
			contact_email: dto.contact_email,
			contact_phone: dto.contact_phone,
			contact_first_name: dto.contact_first_name,
			contact_last_name: dto.contact_last_name,
			contact_patronymic: dto.contact_patronymic,
			selected_plan: dto.selected_plan,
			payment_method: dto.payment_method,
		}, authenticatedEmail);
		return {
			application,
			contactEmailLockedToSession: Boolean(authenticatedEmail),
		};
	}
}
