import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { CompaniesController } from "./companies.controller";
import { CompaniesService } from "./companies.service";
import { MembersController } from "./members.controller";
import { RolesController } from "./roles.controller";

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [CompaniesController, MembersController, RolesController],
	providers: [CompaniesService],
	exports: [CompaniesService],
})
export class CompaniesModule {}
