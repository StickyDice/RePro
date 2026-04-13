import { IsOptional, IsString, MaxLength } from "class-validator";

export class RejectRentalDto {
	@IsOptional()
	@IsString()
	@MaxLength(1000)
	decision_comment?: string;
}
