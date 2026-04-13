import { SetMetadata } from "@nestjs/common";
import { MIN_ROLE_PRIORITY_KEY } from "./role.guard";

/**
 * Role priorities for default roles (from seed):
 * - employee: 10
 * - support: 20
 * - moderator: 30
 * - company_admin: 40
 */
export const ROLE_PRIORITIES = {
	employee: 10,
	support: 20,
	moderator: 30,
	company_admin: 40,
} as const;

/**
 * Decorator to require minimum role priority for a route.
 * Use with RoleGuard (and TenantGuard before it).
 */
export const MinRolePriority = (priority: number) =>
	SetMetadata(MIN_ROLE_PRIORITY_KEY, priority);
