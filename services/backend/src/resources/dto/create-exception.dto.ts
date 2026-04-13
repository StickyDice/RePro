import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateResourceExceptionDto {
	@IsUUID()
	user_id!: string;

	@IsString()
	@IsIn(["allow", "deny"])
	rule_type!: "allow" | "deny";

	@IsOptional()
	@IsString()
	@MaxLength(500)
	reason?: string;
}
