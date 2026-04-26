import {
	BadRequestException,
	ConflictException,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
	MembershipStatus,
	Prisma,
	UserStatus,
} from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaService } from "@/prisma/prisma.service";
import type { UpdateProfileDto } from "./dto/update-profile.dto";
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
			throw new Error("Необходимо задать SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
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

	async ensurePasswordAccount(params: {
		email: string;
		password: string;
		firstName?: string | null;
		lastName?: string | null;
		phone?: string | null;
	}): Promise<{ id: string; email: string; created: boolean }> {
		const email = this.normalizeEmail(params.email);
		if (!email) {
			throw new BadRequestException("Для создания аккаунта требуется email");
		}

		const existingUser = await this.findSupabaseUserByEmail(email);
		if (existingUser) {
			return {
				id: existingUser.id,
				email,
				created: false,
			};
		}

		const { data, error } = await this.supabase.auth.admin.createUser({
			email,
			password: params.password,
			email_confirm: true,
			user_metadata: {
				first_name: params.firstName ?? undefined,
				last_name: params.lastName ?? undefined,
				phone: this.normalizePhone(params.phone) ?? undefined,
			},
		});

		if (error) {
			const linkedUser = await this.findSupabaseUserByEmail(email);
			if (linkedUser) {
				return {
					id: linkedUser.id,
					email,
					created: false,
				};
			}

			throw new InternalServerErrorException(
				error.message || "Не удалось создать аккаунт Supabase",
			);
		}

		if (!data.user) {
			throw new InternalServerErrorException(
				"Создание аккаунта Supabase не вернуло пользователя",
			);
		}

		return {
			id: data.user.id,
			email,
			created: true,
		};
	}

	async setPasswordForEmail(emailInput: string, password: string): Promise<void> {
		const email = this.normalizeEmail(emailInput);
		if (!email) {
			throw new BadRequestException("Для обновления пароля требуется email");
		}

		const existingUser = await this.findSupabaseUserByEmail(email);
		if (!existingUser) {
			throw new BadRequestException("Аккаунт Supabase не найден");
		}

		const { error } = await this.supabase.auth.admin.updateUserById(
			existingUser.id,
			{ password },
		);
		if (error) {
			throw new InternalServerErrorException(
				error.message || "Не удалось обновить пароль в Supabase",
			);
		}
	}

	/**
	 * Sync Supabase user to Prisma. Creates User if not exists.
	 * Returns Prisma User.
	 */
	async syncUserFromSupabase(supabaseUser: User): Promise<RequestUser> {
		const supabaseAuthId = supabaseUser.id;
		const email = this.normalizeEmail(supabaseUser.email);
		const phone = this.normalizePhone(supabaseUser.phone);

		let user = await this.prisma.user.findUnique({
			where: { supabase_auth_id: supabaseAuthId },
		});

		if (!user) {
			if (email) {
				user = await this.findUserByEmail(email, supabaseAuthId);
			}
			if (!user && phone) {
				user = await this.prisma.user.findUnique({
					where: { phone_number: phone },
				});
			}

			if (user) {
				if (
					user.supabase_auth_id &&
					user.supabase_auth_id !== supabaseAuthId
				) {
					throw new ConflictException(
						"Этот email или телефон уже привязан к другой учётной записи.",
					);
				}
				user = await this.prisma.user.update({
					where: { id: user.id },
					data: {
						supabase_auth_id: supabaseAuthId,
						email: email ?? user.email,
						phone_number: phone ?? user.phone_number,
						first_name:
							supabaseUser.user_metadata?.first_name ?? user.first_name,
						last_name:
							supabaseUser.user_metadata?.last_name ?? user.last_name,
						patronymic:
							(supabaseUser.user_metadata?.patronymic as string | undefined) ??
							user.patronymic,
					},
				});
			} else {
				try {
					user = await this.prisma.user.create({
						data: {
							supabase_auth_id: supabaseAuthId,
							email,
							phone_number: phone,
							first_name:
								supabaseUser.user_metadata?.first_name ?? null,
							last_name:
								supabaseUser.user_metadata?.last_name ?? null,
							patronymic:
								(supabaseUser.user_metadata?.patronymic as string | undefined) ??
								null,
							status: UserStatus.active,
						},
					});
				} catch (err) {
					if (
						err instanceof Prisma.PrismaClientKnownRequestError &&
						err.code === "P2002"
					) {
						const linked =
							(await this.prisma.user.findUnique({
								where: { supabase_auth_id: supabaseAuthId },
							})) ||
							(email ? await this.findUserByEmail(email, supabaseAuthId) : null) ||
							(phone
								? await this.prisma.user.findUnique({
										where: { phone_number: phone },
									})
								: null);
						if (
							linked &&
							(!linked.supabase_auth_id ||
								linked.supabase_auth_id === supabaseAuthId)
						) {
							user = await this.prisma.user.update({
								where: { id: linked.id },
								data: {
									supabase_auth_id: supabaseAuthId,
									email: email ?? linked.email,
									phone_number: phone ?? linked.phone_number,
									first_name:
										supabaseUser.user_metadata?.first_name ??
										linked.first_name,
									last_name:
										supabaseUser.user_metadata?.last_name ??
										linked.last_name,
									patronymic:
										(supabaseUser.user_metadata?.patronymic as
											| string
											| undefined) ?? linked.patronymic,
								},
							});
						} else {
							throw err;
						}
					} else {
						throw err;
					}
				}
			}
		} else {
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

		const membership = await this.prisma.membership.findFirst({
			where: {
				company_id: companyIdHeader.trim(),
				user_id: userId,
				status: MembershipStatus.active,
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
				patronymic: true,
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
							select: { id: true, name: true, code: true, priority: true },
						},
					},
				},
			},
		});

		if (!user) return null;

		const isPlatformAdmin = await this.isPlatformContextAdmin(
			user.id,
			user.email,
		);

		return {
			...user,
			isPlatformAdmin,
		};
	}

	async updateProfile(requestUser: RequestUser, dto: UpdateProfileDto) {
		const data: Prisma.UserUpdateInput = {};
		for (const key of ["first_name", "last_name", "patronymic"] as const) {
			if (dto[key] !== undefined) {
				const trimmed = dto[key]!.trim();
				data[key] = trimmed === "" ? null : trimmed;
			}
		}
		if (Object.keys(data).length === 0) {
			return this.getMeWithMemberships(requestUser.id);
		}

		await this.prisma.user.update({
			where: { id: requestUser.id },
			data,
		});

		const row = await this.prisma.user.findUnique({
			where: { id: requestUser.id },
			select: { first_name: true, last_name: true, patronymic: true },
		});
		if (!row) {
			throw new InternalServerErrorException("Пользователь не найден после обновления");
		}

		const { data: supaData, error } = await this.supabase.auth.admin.getUserById(
			requestUser.supabaseAuthId,
		);
		if (!error && supaData.user) {
			const { error: updateError } = await this.supabase.auth.admin.updateUserById(
				requestUser.supabaseAuthId,
				{
					user_metadata: {
						...supaData.user.user_metadata,
						first_name: row.first_name ?? undefined,
						last_name: row.last_name ?? undefined,
						patronymic: row.patronymic ?? undefined,
					},
				},
			);
			if (updateError) {
				throw new InternalServerErrorException(
					updateError.message || "Не удалось обновить профиль в Supabase",
				);
			}
		}

		return this.getMeWithMemberships(requestUser.id);
	}

	/**
	 * Full access to /platform/* and `isPlatformAdmin` in /auth/me.
	 * Emails in PLATFORM_ADMIN_EMAILS alone are not enough: a company admin whose
	 * contact email is also in that list (misconfiguration) must not get global
	 * platform access — they have active membership in their company.
	 */
	async isPlatformContextAdmin(
		userId: string,
		email: string | null,
	): Promise<boolean> {
		if (!this.isPlatformAdminEmail(email)) {
			return false;
		}
		const activeMemberships = await this.prisma.membership.count({
			where: { user_id: userId, status: MembershipStatus.active },
		});
		return activeMemberships === 0;
	}

	private isPlatformAdminEmail(email: string | null): boolean {
		const emailsStr = this.config.get<string>("PLATFORM_ADMIN_EMAILS");
		if (!email || !emailsStr) return false;

		const normalizedEmail = this.normalizeEmail(email);
		if (!normalizedEmail) return false;
		return emailsStr
			.split(",")
			.map((value) => this.normalizeEmail(value))
			.filter(Boolean)
			.includes(normalizedEmail);
	}

	private normalizeEmail(email: string | null | undefined): string | null {
		const normalized = email?.trim().toLowerCase();
		return normalized ? normalized : null;
	}

	private normalizePhone(phone: string | null | undefined): string | null {
		const normalized = phone?.trim();
		return normalized ? normalized : null;
	}

	private async findUserByEmail(
		email: string,
		supabaseAuthId: string,
	) {
		const matches = await this.prisma.user.findMany({
			where: {
				email: {
					equals: email,
					mode: Prisma.QueryMode.insensitive,
				},
			},
			include: {
				memberships: {
					select: { id: true },
				},
			},
			orderBy: { created_at: "asc" },
		});

		return (
			matches.find((candidate) => candidate.supabase_auth_id === supabaseAuthId) ??
			matches.find(
				(candidate) =>
					!candidate.supabase_auth_id && candidate.memberships.length > 0,
			) ??
			matches.find((candidate) => !candidate.supabase_auth_id) ??
			matches.find((candidate) => candidate.memberships.length > 0) ??
			matches[0] ??
			null
		);
	}

	private async findSupabaseUserByEmail(email: string): Promise<User | null> {
		let page = 1;
		while (true) {
			const { data, error } = await this.supabase.auth.admin.listUsers({
				page,
				perPage: 200,
			});
			if (error) {
				throw new InternalServerErrorException(
					error.message || "Не удалось получить список пользователей Supabase",
				);
			}

			const match =
				data.users.find(
					(candidate) => this.normalizeEmail(candidate.email) === email,
				) ?? null;
			if (match) {
				return match;
			}

			if (!data.nextPage) {
				return null;
			}

			page = data.nextPage;
		}
	}

	/**
	 * Verify user has membership in company.
	 */
	async hasMembership(userId: string, companyId: string): Promise<boolean> {
		const m = await this.prisma.membership.findFirst({
			where: {
				company_id: companyId,
				user_id: userId,
				status: MembershipStatus.active,
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
