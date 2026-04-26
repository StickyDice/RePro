import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	Patch,
	Post,
	Req,
	UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { PasswordResetConfirmDto } from "./dto/password-reset-confirm.dto";
import { PasswordResetRequestDto } from "./dto/password-reset-request.dto";
import { SelectCompanyDto } from "./dto/select-company.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { RequestUser } from "./types";
import { User as RequestUserDecorator } from "./user.decorator";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	/**
	 * Validate token and return user info. For client to check session.
	 */
	@Get("verify")
	@UseGuards(AuthGuard)
	async verify(@RequestUserDecorator() user: RequestUser) {
		const data = await this.authService.getMeWithMemberships(user.id);
		return { user: data };
	}

	/**
	 * Get current user with memberships (companies). Requires AuthGuard.
	 */
	@Get("me")
	@UseGuards(AuthGuard)
	async me(@RequestUserDecorator() user: RequestUser) {
		const data = await this.authService.getMeWithMemberships(user.id);
		return { user: data };
	}

	/**
	 * Update current user's name fields (Prisma + Supabase user_metadata).
	 */
	@Patch("me")
	@UseGuards(AuthGuard)
	async updateMe(
		@RequestUserDecorator() user: RequestUser,
		@Body() dto: UpdateProfileDto,
	) {
		const data = await this.authService.updateProfile(user, dto);
		return { user: data };
	}

	/**
	 * Select company. Verify membership, return OK. Client stores companyId and sends X-Company-Id.
	 */
	@Post("select-company")
	@UseGuards(AuthGuard)
	async selectCompany(
		@RequestUserDecorator() user: RequestUser,
		@Body() dto: SelectCompanyDto,
	) {
		const hasMembership = await this.authService.hasMembership(
			user.id,
			dto.companyId,
		);
		if (!hasMembership) {
			throw new ForbiddenException("У вас нет доступа к этой компании");
		}
		return { ok: true, companyId: dto.companyId };
	}

	/**
	 * Request password reset. Calls Supabase auth.resetPasswordForEmail.
	 */
	@Post("password-reset/request")
	async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
		await this.authService.requestPasswordReset(dto.email);
		return { ok: true, message: "Если email существует, ссылка для сброса отправлена" };
	}

	/**
	 * Called by frontend when user lands from recovery link. Sets User.status = pending_verification.
	 * Either call with Bearer token (userId derived from token) or with body { userId }.
	 */
	@Post("password-reset/confirm")
	async confirmPasswordReset(
		@Req() req: Request & { user?: RequestUser },
		@Body() dto: PasswordResetConfirmDto,
	) {
		let userId: string | undefined;
		if (req.headers.authorization?.startsWith("Bearer ")) {
			const token = req.headers.authorization.slice(7);
			const supabaseUser = await this.authService.verifyToken(token);
			if (supabaseUser) {
				const synced =
					await this.authService.syncUserFromSupabase(supabaseUser);
				userId = synced.id;
			}
		}
		if (!userId && dto.userId) userId = dto.userId;
		if (!userId) {
			return { ok: false, message: "Передайте Bearer-токен или userId в теле запроса" };
		}
		await this.authService.confirmPasswordReset(userId);
		return { ok: true };
	}
}
