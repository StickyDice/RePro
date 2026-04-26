import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Inject,
	Injectable,
	Scope,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import type { Request } from "express";
import { AuthService } from "@/auth/auth.service";
import type { RequestUser } from "@/auth/types";

/**
 * Global platform admin: email in PLATFORM_ADMIN_EMAILS and no active company
 * membership. Must be used after AuthGuard - relies on request.user.
 *
 * Usage: @UseGuards(AuthGuard, PlatformAdminGuard)
 */
@Injectable({ scope: Scope.REQUEST })
export class PlatformAdminGuard implements CanActivate {
	constructor(
		private readonly authService: AuthService,
		@Inject(REQUEST)
		private readonly request: Request & { user?: RequestUser },
	) {}

	async canActivate(_context: ExecutionContext): Promise<boolean> {
		const user = this.request.user;
		if (!user) {
			throw new ForbiddenException("Требуется авторизация");
		}

		const allowed = await this.authService.isPlatformContextAdmin(
			user.id,
			user.email,
		);
		if (!allowed) {
			throw new ForbiddenException("Требуется доступ администратора платформы");
		}

		return true;
	}
}
