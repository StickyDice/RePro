import {
	createParamDecorator,
	ExecutionContext,
	UnauthorizedException,
} from "@nestjs/common";
import type { RequestUser } from "./types";

export const User = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): RequestUser => {
		const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
		const user = request.user;
		if (!user) {
			throw new UnauthorizedException("Authentication required");
		}
		return user;
	},
);
