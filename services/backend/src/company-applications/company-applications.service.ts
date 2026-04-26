import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class CompanyApplicationsService {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: {
		company_name: string;
		inn: string;
		contact_email: string;
		contact_phone: string;
		contact_first_name: string;
		contact_last_name: string;
		contact_patronymic?: string;
		selected_plan: string;
		payment_method: string;
	},
	authenticatedEmail?: string | null) {
		const contactEmail = (authenticatedEmail ?? data.contact_email)
			.trim()
			.toLowerCase();
		const contactPhone = data.contact_phone.trim();

		// Ensure plan exists
		const plan = await this.prisma.plan.findUnique({
			where: { code: data.selected_plan, is_active: true },
		});
		if (!plan) {
			throw new BadRequestException(
				`Plan "${data.selected_plan}" is missing in the database (plans are created by prisma seed). From services/backend run: pnpm prisma:seed — use the same DATABASE_URL as this API.`,
			);
		}

		return this.prisma.companyApplication.create({
			data: {
				company_name: data.company_name,
				inn: data.inn,
				contact_email: contactEmail,
				contact_phone: contactPhone,
				contact_first_name: data.contact_first_name,
				contact_last_name: data.contact_last_name,
				contact_patronymic: data.contact_patronymic ?? null,
				selected_plan: data.selected_plan,
				payment_method: data.payment_method,
				status: "pending",
			},
		});
	}
}
