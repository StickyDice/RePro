import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { TenantContextModule } from "@/tenant-context/tenant-context.module";
import { ResourceAccessService } from "./resource-access.service";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";

@Module({
	imports: [PrismaModule, TenantContextModule, AuthModule],
	controllers: [ResourcesController],
	providers: [ResourcesService, ResourceAccessService],
	exports: [ResourcesService, ResourceAccessService],
})
export class ResourcesModule {}
