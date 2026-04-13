import {
	IsEmail,
	IsIn,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

const VALID_PLAN_CODES = ["basic", "pro", "enterprise"] as const;

export class CreateCompanyApplicationDto {
	@IsString()
	@MinLength(1)
	@MaxLength(255)
	company_name!: string;

	@IsString()
	@MinLength(10)
	@MaxLength(12)
	inn!: string;

	@IsEmail()
	contact_email!: string;

	@IsString()
	@MinLength(1)
	@MaxLength(50)
	contact_phone!: string;

	@IsString()
	@MinLength(1)
	@MaxLength(100)
	contact_first_name!: string;

	@IsString()
	@MinLength(1)
	@MaxLength(100)
	contact_last_name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	contact_patronymic?: string;

	@IsString()
	@IsIn(VALID_PLAN_CODES)
	selected_plan!: (typeof VALID_PLAN_CODES)[number];

	@IsString()
	@MinLength(1)
	@MaxLength(50)
	payment_method!: string;
}
