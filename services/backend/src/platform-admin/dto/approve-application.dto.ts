import { IsOptional, IsString, MaxLength } from "class-validator";

export class ApproveApplicationDto {
	@IsOptional()
	@IsString()
	@MaxLength(1000)
	review_comment?: string;
}
