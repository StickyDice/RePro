/**
 * In-memory copy of the Supabase access token, updated from AuthProvider.
 * Avoids awaiting `supabase.auth.getSession()` on every API call (that can stall
 * or queue badly when many requests run during auth updates).
 */
let accessToken: string | null = null;

export function setBrowserAccessToken(token: string | null): void {
	accessToken = token;
}

export function getBrowserAccessToken(): string | null {
	return accessToken;
}
