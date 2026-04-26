import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Inject,
	Injectable,
	Scope,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { REQUEST } from "@nestjs/core";
import type { Request } from "express";
import type { RequestUser } from "@/auth/types";

/**
 * Guard that checks if the authenticated user's email is in PLATFORM_ADMIN_EMAILS.
 * Must be used after AuthGuard - relies on request.user.
 *
 * Usage: @UseGuards(AuthGuard, PlatformAdminGuard)
 */
@Injectable({ scope: Scope.REQUEST })
export class PlatformAdminGuard implements CanActivate {
	constructor(
		private readonly config: ConfigService,
		@Inject(REQUEST)
		private readonly request: Request & { user?: RequestUser },
	) {}

	canActivate(_context: ExecutionContext): boolean {
		const user = this.request.user;
		if (!user) {
			throw new ForbiddenException("Требуется авторизация");
		}

		const emailsStr = this.config.get<string>("PLATFORM_ADMIN_EMAILS");
		const adminEmails = emailsStr
			? emailsStr
					.split(",")
					.map((e) => e.trim().toLowerCase())
					.filter(Boolean)
			: [];

		if (adminEmails.length === 0) {
			throw new ForbiddenException("Доступ администратора платформы не настроен");
		}

		const userEmail = user.email?.trim().toLowerCase();
		if (!userEmail || !adminEmails.includes(userEmail)) {
			throw new ForbiddenException("Требуется доступ администратора платформы");
		}

		return true;
	}
}
