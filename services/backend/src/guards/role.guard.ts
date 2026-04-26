import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Inject,
	Injectable,
	Scope,
} from "@nestjs/common";
import { REQUEST, Reflector } from "@nestjs/core";
import type { Request } from "express";

export const MIN_ROLE_PRIORITY_KEY = "minRolePriority";

/**
 * Guard that checks the user's role priority meets the minimum required.
 * Must be used after TenantGuard - relies on request.membership.role.
 *
 * Usage: @UseGuards(TenantGuard, RoleGuard)
 *        @MinRolePriority(20)  // e.g. moderator has priority 20
 */
@Injectable({ scope: Scope.REQUEST })
export class RoleGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		@Inject(REQUEST)
		private readonly request: Request & {
			membership?: { role: { priority: number } };
		},
	) {}

	canActivate(context: ExecutionContext): boolean {
		const minPriority = this.reflector.get<number | undefined>(
			MIN_ROLE_PRIORITY_KEY,
			context.getHandler(),
		);
		if (minPriority === undefined) {
			return true;
		}

		const membership = this.request.membership;
		if (!membership) {
			throw new ForbiddenException(
				"Перед RoleGuard должен применяться TenantGuard",
			);
		}

		const userPriority = membership.role.priority;
		if (userPriority < minPriority) {
			throw new ForbiddenException(
				`Недостаточный уровень роли. Требуется приоритет >= ${minPriority}`,
			);
		}

		return true;
	}
}
