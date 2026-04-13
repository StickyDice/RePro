import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { CompaniesModule } from "./companies/companies.module";
import { CompanyApplicationsModule } from "./company-applications/company-applications.module";
import { HealthModule } from "./health/health.module";
import { PlatformAdminModule } from "./platform-admin/platform-admin.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RentalsModule } from "./rentals/rentals.module";
import { ResourcesModule } from "./resources/resources.module";
import { StatisticsModule } from "./statistics/statistics.module";
import { TenantContextModule } from "./tenant-context/tenant-context.module";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		PrismaModule,
		TenantContextModule,
		AuthModule,
		HealthModule,
		CompanyApplicationsModule,
		CompaniesModule,
		PlatformAdminModule,
		ResourcesModule,
		RentalsModule,
		StatisticsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
