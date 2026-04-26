import type { User } from "@entities/user/types";
import { getStoredCompanyId } from "@shared/lib/selected-company";

/** Mirrors backend `ROLE_PRIORITIES` (prisma seed). */
export const ROLE_PRIORITIES = {
	employee: 10,
	support: 20,
	moderator: 30,
	company_admin: 40,
} as const;

export function getActiveMembership(profile: User | null) {
	if (!profile?.memberships.length) {
		return null;
	}
	const stored = getStoredCompanyId();
	if (stored) {
		const match = profile.memberships.find((m) => m.company_id === stored);
		if (match) {
			return match;
		}
	}
	return (
		profile.memberships.find((m) => m.is_default_company) ??
		profile.memberships[0] ??
		null
	);
}

export function activeRolePriority(profile: User | null): number | null {
	const m = getActiveMembership(profile);
	return m?.role.priority ?? null;
}

export function hasMinRole(profile: User | null, minPriority: number): boolean {
	const p = activeRolePriority(profile);
	if (p === null) {
		return false;
	}
	return p >= minPriority;
}
