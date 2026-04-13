import { IsIn, IsOptional } from "class-validator";

export class ListRentalsQueryDto {
	@IsOptional()
	@IsIn(["pending", "approved", "rejected", "cancelled", "completed"])
	status?: "pending" | "approved" | "rejected" | "cancelled" | "completed";
}
