import {
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
	MinLength,
} from "class-validator";

export class UpdateResourceDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(255)
	name?: string;

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(50)
	code?: string;

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	description?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	category?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	quantity_total?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	quantity_active?: number;

	@IsOptional()
	@IsUUID()
	min_role_id?: string | null;
}
