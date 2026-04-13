import { IsOptional, IsUUID } from "class-validator";

export class PasswordResetConfirmDto {
	@IsOptional()
	@IsUUID()
	userId?: string;
}
