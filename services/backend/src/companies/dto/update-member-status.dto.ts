import { IsIn } from "class-validator";

const VALID_STATUSES = ["active", "blocked"] as const;

export class UpdateMemberStatusDto {
	@IsIn(VALID_STATUSES)
	status!: (typeof VALID_STATUSES)[number];
}
