import {
	IsDateString,
	IsOptional,
	IsString,
	IsUUID,
} from "class-validator";

export class StatisticsPeriodQueryDto {
	@IsDateString()
	startDate!: string;

	@IsDateString()
	endDate!: string;
}

export class StatisticsResourcesQueryDto extends StatisticsPeriodQueryDto {
	@IsOptional()
	@IsUUID()
	resourceId?: string;

	@IsOptional()
	@IsString()
	category?: string;
}
