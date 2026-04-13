import { IsOptional, IsString, MaxLength } from "class-validator";

export class ApproveRentalDto {
	@IsOptional()
	@IsString()
	@MaxLength(1000)
	decision_comment?: string;
}
