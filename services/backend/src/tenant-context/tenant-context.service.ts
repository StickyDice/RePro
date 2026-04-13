import {
	Inject,
	Injectable,
	Scope,
	UnauthorizedException,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import type { Request } from "express";

export const X_COMPANY_ID_HEADER = "x-company-id";

/**
 * Request-scoped service that provides the active company (tenant) context.
 * Extracts company_id from:
 * 1. X-Company-Id header
 * 2. JWT/session (when auth is implemented - via request.user?.activeCompanyId)
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
	constructor(
		@Inject(REQUEST)
		private readonly request: Request & {
			user?: { id: string; activeCompanyId?: string };
		},
	) {}

	/**
	 * Get the current company ID from header, route params, or session/JWT.
	 * Returns undefined if not set.
	 * Route param companyId is used for /companies/:companyId/... routes.
	 */
	getCompanyId(): string | undefined {
		const fromHeader = this.request.headers[X_COMPANY_ID_HEADER.toLowerCase()];
		if (typeof fromHeader === "string" && fromHeader.trim()) {
			return fromHeader.trim();
		}
		const fromParams = this.request.params?.companyId;
		if (typeof fromParams === "string" && fromParams.trim()) {
			return fromParams.trim();
		}
		return this.request.user?.activeCompanyId;
	}

	/**
	 * Get the current company ID or throw if not set.
	 */
	requireCompanyId(): string {
		const companyId = this.getCompanyId();
		if (!companyId) {
			throw new UnauthorizedException(
				"Company context required. Provide X-Company-Id header or select company in session.",
			);
		}
		return companyId;
	}

	/**
	 * Get the current user ID from request (set by auth guard).
	 * Returns undefined if user is not authenticated.
	 */
	getUserId(): string | undefined {
		return this.request.user?.id;
	}

	/**
	 * Get the current membership (set by TenantGuard).
	 * Returns undefined if not set.
	 */
	getMembership(): { role: { priority: number } } | undefined {
		return (
			this.request as Request & { membership?: { role: { priority: number } } }
		).membership;
	}

	/**
	 * Get the current user ID or throw if not authenticated.
	 */
	requireUserId(): string {
		const userId = this.getUserId();
		if (!userId) {
			throw new UnauthorizedException("Authentication required");
		}
		return userId;
	}
}
