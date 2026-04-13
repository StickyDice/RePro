import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserStatus } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaService } from "@/prisma/prisma.service";
import type { RequestUser } from "./types";

@Injectable()
export class AuthService {
	private supabase: SupabaseClient;

	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
	) {
		const url = this.config.get<string>("SUPABASE_URL");
		const serviceKey = this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY");
		if (!url || !serviceKey) {
			throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
		}
		this.supabase = createClient(url, serviceKey, {
			auth: { persistSession: false },
		});
	}

	/**
	 * Verify JWT and return Supabase user. Returns null if invalid.
	 */
	async verifyToken(jwt: string): Promise<User | null> {
		const {
			data: { user },
			error,
		} = await this.supabase.auth.getUser(jwt);
		if (error || !user) return null;
		return user;
	}

	/**
	 * Sync Supabase user to Prisma. Creates User if not exists.
	 * Returns Prisma User.
	 */
	async syncUserFromSupabase(supabaseUser: User): Promise<RequestUser> {
		const supabaseAuthId = supabaseUser.id;
		const email = supabaseUser.email ?? null;
		const phone = supabaseUser.phone ?? null;

		let user = await this.prisma.user.findUnique({
			where: { supabase_auth_id: supabaseAuthId },
		});

		if (!user) {
			user = await this.prisma.user.create({
				data: {
					supabase_auth_id: supabaseAuthId,
					email,
					phone_number: phone,
					first_name: supabaseUser.user_metadata?.first_name ?? null,
					last_name: supabaseUser.user_metadata?.last_name ?? null,
					status: UserStatus.active,
				},
			});
		} else {
			// Update email/phone if changed in Supabase
			user = await this.prisma.user.update({
				where: { id: user.id },
				data: {
					email: email ?? undefined,
					phone_number: phone ?? undefined,
				},
			});
		}

		return {
			id: user.id,
			supabaseAuthId,
			email: user.email,
			status: user.status,
		};
	}

	/**
	 * Resolve activeCompanyId from X-Company-Id header when user has membership.
	 */
	async resolveActiveCompanyId(
		userId: string,
		companyIdHeader: string | undefined,
	): Promise<string | undefined> {
		if (!companyIdHeader?.trim()) return undefined;

		const membership = await this.prisma.membership.findUnique({
			where: {
				company_id_user_id: {
					company_id: companyIdHeader.trim(),
					user_id: userId,
				},
				status: "active",
			},
		});
		return membership ? membership.company_id : undefined;
	}

	/**
	 * Get user with memberships (companies).
	 */
	async getMeWithMemberships(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				first_name: true,
				last_name: true,
				status: true,
				memberships: {
					where: { status: "active" },
					select: {
						id: true,
						company_id: true,
						is_default_company: true,
						company: {
							select: {
								id: true,
								name: true,
								inn: true,
							},
						},
						role: {
							select: { id: true, name: true, code: true },
						},
					},
				},
			},
		});

		if (!user) return null;

		return {
			...user,
			isPlatformAdmin: this.isPlatformAdminEmail(user.email),
		};
	}

	private isPlatformAdminEmail(email: string | null): boolean {
		const emailsStr = this.config.get<string>("PLATFORM_ADMIN_EMAILS");
		if (!email || !emailsStr) return false;

		const normalizedEmail = email.trim().toLowerCase();
		return emailsStr
			.split(",")
			.map((value) => value.trim().toLowerCase())
			.filter(Boolean)
			.includes(normalizedEmail);
	}

	/**
	 * Verify user has membership in company.
	 */
	async hasMembership(userId: string, companyId: string): Promise<boolean> {
		const m = await this.prisma.membership.findUnique({
			where: {
				company_id_user_id: { company_id: companyId, user_id: userId },
				status: "active",
			},
		});
		return !!m;
	}

	/**
	 * Request password reset via Supabase.
	 */
	async requestPasswordReset(email: string): Promise<void> {
		const redirectUrl = this.config.get("SUPABASE_PASSWORD_RESET_REDIRECT") as
			| string
			| undefined;
		await this.supabase.auth.resetPasswordForEmail(email.trim(), {
			...(redirectUrl && { redirectTo: redirectUrl }),
		});
		// Supabase doesn't reveal if email exists - we always return success
	}

	/**
	 * Called when user lands from recovery link. Sets status to pending_verification.
	 * Stub for notifying moderators.
	 */
	async confirmPasswordReset(userId: string): Promise<void> {
		await this.prisma.user.update({
			where: { id: userId },
			data: { status: UserStatus.pending_verification },
		});
		// TODO: notify moderators (stub for now)
	}
}
