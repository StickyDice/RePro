import { Module } from "@nestjs/common";
import { AuditModule } from "@/audit/audit.module";
import { AuthModule } from "@/auth/auth.module";
import { CalendarModule } from "@/calendar/calendar.module";
import { NotificationModule } from "@/notifications/notification.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { ResourcesModule } from "@/resources/resources.module";
import { TenantContextModule } from "@/tenant-context/tenant-context.module";
import { RentalsController } from "./rentals.controller";
import { RentalsService } from "./rentals.service";

@Module({
	imports: [
		PrismaModule,
		TenantContextModule,
		AuthModule,
		ResourcesModule,
		NotificationModule,
		AuditModule,
		CalendarModule,
	],
	controllers: [RentalsController],
	providers: [RentalsService],
})
export class RentalsModule {}
