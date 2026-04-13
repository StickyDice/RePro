import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CompanyApplicationsController } from "./company-applications.controller";
import { CompanyApplicationsService } from "./company-applications.service";

@Module({
	imports: [PrismaModule],
	controllers: [CompanyApplicationsController],
	providers: [CompanyApplicationsService],
	exports: [CompanyApplicationsService],
})
export class CompanyApplicationsModule {}
