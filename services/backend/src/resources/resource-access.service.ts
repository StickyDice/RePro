import { Injectable } from "@nestjs/common";
import { ResourceUserExceptionRuleType } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * Service to check if a user can access a resource based on:
 * - membership role priority >= min_role priority
 * - deny exceptions (forbid)
 * - allow exceptions (permit lower role)
 * - Deny wins over allow per plan
 */
@Injectable()
export class ResourceAccessService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Check if a user can access a resource in the given company.
	 * @returns true if user can access, false otherwise
	 */
	async canUserAccessResource(
		userId: string,
		resourceId: string,
		companyId: string,
	): Promise<boolean> {
		const [resource, membership, exceptions] = await Promise.all([
			this.prisma.resource.findFirst({
				where: { id: resourceId, company_id: companyId, is_active: true },
				include: { min_role: true },
			}),
			this.prisma.membership.findUnique({
				where: {
					company_id_user_id: { company_id: companyId, user_id: userId },
				},
				include: { role: true },
			}),
			this.prisma.resourceUserException.findMany({
				where: { resource_id: resourceId, user_id: userId },
			}),
		]);

		if (!resource || !membership) {
			return false;
		}

		// Deny wins over allow per plan
		const denyException = exceptions.find(
			(e) => e.rule_type === ResourceUserExceptionRuleType.deny,
		);
		if (denyException) {
			return false;
		}

		const allowException = exceptions.find(
			(e) => e.rule_type === ResourceUserExceptionRuleType.allow,
		);
		if (allowException) {
			return true;
		}

		// No min_role means resource is accessible to all company members
		if (!resource.min_role_id || !resource.min_role) {
			return true;
		}

		// Check role priority: user's role priority must be >= min_role priority
		const userPriority = membership.role.priority;
		const minPriority = resource.min_role.priority;
		return userPriority >= minPriority;
	}
}
