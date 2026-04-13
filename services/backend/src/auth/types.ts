import type { UserStatus } from "@prisma/client";

/**
 * User object attached to request by AuthGuard.
 */
export interface RequestUser {
	id: string;
	supabaseAuthId: string;
	email: string | null;
	status: UserStatus;
	activeCompanyId?: string;
}
