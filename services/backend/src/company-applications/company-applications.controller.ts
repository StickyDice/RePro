import { Body, Controller, Post } from "@nestjs/common";
import { CompanyApplicationsService } from "./company-applications.service";
import { CreateCompanyApplicationDto } from "./dto/create-company-application.dto";

@Controller("company-applications")
export class CompanyApplicationsController {
	constructor(
		private readonly companyApplicationsService: CompanyApplicationsService,
	) {}

	/**
	 * Create a company application. Public endpoint, no auth required.
	 */
	@Post()
	async create(@Body() dto: CreateCompanyApplicationDto) {
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
		});
		return { application };
	}
}
