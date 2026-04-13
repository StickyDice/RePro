import { IsUUID } from "class-validator";

export class UpdateMemberRoleDto {
	@IsUUID()
	role_id!: string;
}
