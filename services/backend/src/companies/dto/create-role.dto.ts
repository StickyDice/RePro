import {
	IsInt,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	MinLength,
} from "class-validator";

export class CreateRoleDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	name!: string;

	@IsString()
	@MinLength(1)
	@MaxLength(50)
	code!: string;

	@IsInt()
	@Min(0)
	priority!: number;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;
}
