import {
	IsEmail,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	MinLength,
} from "class-validator";

export class AddMemberDto {
	@IsEmail()
	email!: string;

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(50)
	phone?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	first_name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	last_name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	patronymic?: string;

	@IsUUID()
	role_id!: string;
}
