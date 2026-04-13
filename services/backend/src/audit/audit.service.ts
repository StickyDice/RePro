import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

export interface AuditLogPayload {
	companyId: string;
	actorUserId: string;
	action: string;
	entityType: string;
	entityId?: string;
	payload?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
	constructor(private readonly prisma: PrismaService) {}

	async log(
		companyId: string,
		actorUserId: string,
		action: string,
		entityType: string,
		entityId?: string,
		payload?: Record<string, unknown>,
	): Promise<void> {
		await this.prisma.auditLog.create({
			data: {
				company_id: companyId,
				actor_user_id: actorUserId,
				action,
				entity_type: entityType,
				entity_id: entityId ?? null,
				payload_json: payload
					? (payload as Prisma.InputJsonValue)
					: Prisma.JsonNull,
			},
		});
	}
}
