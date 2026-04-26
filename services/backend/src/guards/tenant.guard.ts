import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Inject,
	Injectable,
	Scope,
	UnauthorizedException,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { MembershipStatus } from "@prisma/client";
import type { Request } from "express";
import { PrismaService } from "@/prisma/prisma.service";
import { TenantContextService } from "@/tenant-context/tenant-context.service";

/**
 * Guard that ensures the authenticated user has an active membership
 * in the company specified by X-Company-Id or session.
 * Must be used after authentication - expects request.user.id.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantGuard implements CanActivate {
	constructor(
		private readonly prisma: PrismaService,
		private readonly tenantContext: TenantContextService,
		@Inject(REQUEST)
		private readonly request: Request & { user?: { id: string } },
	) {}

	async canActivate(_context: ExecutionContext): Promise<boolean> {
		const userId = this.tenantContext.getUserId() ?? this.request.user?.id;
		if (!userId) {
			throw new UnauthorizedException("Требуется авторизация");
		}

		const companyId = this.tenantContext.getCompanyId();
		if (!companyId) {
			throw new UnauthorizedException(
				"Требуется контекст компании. Передайте заголовок X-Company-Id.",
			);
		}

		const membership = await this.prisma.membership.findUnique({
			where: {
				company_id_user_id: { company_id: companyId, user_id: userId },
			},
			include: { role: true },
		});

		if (!membership) {
			throw new ForbiddenException("У вас нет доступа к этой компании");
		}

		if (membership.status !== MembershipStatus.active) {
			throw new ForbiddenException(
				`Статус участия: ${membership.status}. Доступ есть только у активных участников.`,
			);
		}

		// Attach membership and role to request for downstream use
		(this.request as Request & { membership?: typeof membership }).membership =
			membership;

		return true;
	}
}
