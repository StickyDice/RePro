import { IsDateString } from "class-validator";

export class AvailabilityQueryDto {
	@IsDateString()
	startDate!: string;

	@IsDateString()
	endDate!: string;
}
