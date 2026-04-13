import {
	Body,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import type { RequestUser } from "@/auth/types";
import { User } from "@/auth/user.decorator";
import {
	MinRolePriority,
	ROLE_PRIORITIES,
	RoleGuard,
	TenantGuard,
} from "@/guards";
import { ApproveRentalDto } from "./dto/approve-rental.dto";
import { CreateRentalDto } from "./dto/create-rental.dto";
import { ListRentalsQueryDto } from "./dto/list-rentals-query.dto";
import { RejectRentalDto } from "./dto/reject-rental.dto";
import { RentalsService } from "./rentals.service";

@Controller("companies/:companyId/rentals")
@UseGuards(AuthGuard, TenantGuard)
export class RentalsController {
	constructor(private readonly rentalsService: RentalsService) {}

	@Get("my")
	async getMyRentals(@Param("companyId", ParseUUIDPipe) companyId: string) {
		return this.rentalsService.getMyRentals(companyId);
	}

	@Get()
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.support)
	async listRentals(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Query() query: ListRentalsQueryDto,
	) {
		return this.rentalsService.listRentals(companyId, query.status);
	}

	@Post()
	async createRental(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Body() dto: CreateRentalDto,
		@User() user: RequestUser,
	) {
		return this.rentalsService.createRental(companyId, dto, user.id);
	}

	@Get(":rentalId")
	async getRental(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("rentalId", ParseUUIDPipe) rentalId: string,
	) {
		return this.rentalsService.getRental(companyId, rentalId);
	}

	@Patch(":rentalId/approve")
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.support)
	async approveRental(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("rentalId", ParseUUIDPipe) rentalId: string,
		@Body() dto: ApproveRentalDto,
		@User() user: RequestUser,
	) {
		return this.rentalsService.approveRental(
			companyId,
			rentalId,
			dto.decision_comment,
			user.id,
		);
	}

	@Patch(":rentalId/reject")
	@UseGuards(RoleGuard)
	@MinRolePriority(ROLE_PRIORITIES.support)
	async rejectRental(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("rentalId", ParseUUIDPipe) rentalId: string,
		@Body() dto: RejectRentalDto,
		@User() user: RequestUser,
	) {
		return this.rentalsService.rejectRental(
			companyId,
			rentalId,
			dto.decision_comment,
			user.id,
		);
	}

	@Patch(":rentalId/cancel")
	async cancelRental(
		@Param("companyId", ParseUUIDPipe) companyId: string,
		@Param("rentalId", ParseUUIDPipe) rentalId: string,
	) {
		return this.rentalsService.cancelRental(companyId, rentalId);
	}
}
