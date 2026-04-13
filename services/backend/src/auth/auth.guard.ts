import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	Scope,
	UnauthorizedException,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import type { Request } from "express";
import { X_COMPANY_ID_HEADER } from "@/tenant-context/tenant-context.service";
import { AuthService } from "./auth.service";
import type { RequestUser } from "./types";

@Injectable({ scope: Scope.REQUEST })
export class AuthGuard implements CanActivate {
	constructor(
		private readonly authService: AuthService,
		@Inject(REQUEST) private readonly request: Request & { user?: RequestUser },
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<Request>();
		const authHeader = req.headers.authorization;
		const token = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: undefined;

		if (!token) {
			throw new UnauthorizedException(
				"Missing or invalid Authorization header",
			);
		}

		const supabaseUser = await this.authService.verifyToken(token);
		if (!supabaseUser) {
			throw new UnauthorizedException("Invalid or expired token");
		}

		const requestUser =
			await this.authService.syncUserFromSupabase(supabaseUser);

		const companyIdHeader = req.headers[X_COMPANY_ID_HEADER.toLowerCase()] as
			| string
			| undefined;
		const activeCompanyId = await this.authService.resolveActiveCompanyId(
			requestUser.id,
			companyIdHeader,
		);
		if (activeCompanyId) {
			requestUser.activeCompanyId = activeCompanyId;
		}

		this.request.user = requestUser;
		return true;
	}
}
