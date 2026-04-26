import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { CompanyApplicationsController } from "./company-applications.controller";
import { CompanyApplicationsService } from "./company-applications.service";

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [CompanyApplicationsController],
	providers: [CompanyApplicationsService],
	exports: [CompanyApplicationsService],
})
export class CompanyApplicationsModule {}
