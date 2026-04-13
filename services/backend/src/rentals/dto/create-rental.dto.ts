import {
	IsDateString,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
} from "class-validator";

export class CreateRentalDto {
	@IsUUID()
	resource_id!: string;

	@IsDateString()
	requested_start_at!: string;

	@IsDateString()
	requested_end_at!: string;

	@IsOptional()
	@IsString()
	@MaxLength(2000)
	comment?: string;
}
