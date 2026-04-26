import {
	getBrowserAccessToken,
	setBrowserAccessToken,
} from "@shared/lib/auth-access-token";
import { getStoredCompanyId } from "@shared/lib/selected-company";
import { createBrowserClient as getSupabase } from "@shared/lib/supabase";

const baseURL =
	typeof window !== "undefined"
		? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
		: "";

const GET_SESSION_TIMEOUT_MS = 8_000;

async function resolveAccessToken(): Promise<string | null> {
	let token = getBrowserAccessToken();
	if (token) return token;

	const supabase = getSupabase();
	try {
		const result = await Promise.race([
			supabase.auth.getSession(),
			new Promise<never>((_, reject) =>
				setTimeout(
					() => reject(new Error("Истекло время ожидания getSession")),
					GET_SESSION_TIMEOUT_MS,
				),
			),
		]);
		token = result.data.session?.access_token ?? null;
		setBrowserAccessToken(token);
		return token;
	} catch {
		return null;
	}
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	const token = await resolveAccessToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const companyId = getStoredCompanyId();
	if (companyId) {
		headers["X-Company-Id"] = companyId;
	}
	return headers;
}

export async function apiFetch<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const url = path.startsWith("http") ? path : `${baseURL}${path}`;
	const headers = await getAuthHeaders();
	const response = await fetch(url, {
		...options,
		headers: {
			...headers,
			...options.headers,
		},
		credentials: "include",
	});
	if (!response.ok) {
		const text = await response.text();
		let error: Error;
		try {
			const json = JSON.parse(text);
			error = new Error(json.message ?? text ?? "Ошибка запроса");
		} catch {
			error = new Error(text || response.statusText || "Ошибка запроса");
		}
		(error as Error & { status?: number }).status = response.status;
		throw error;
	}
	const contentType = response.headers.get("content-type");
	if (contentType?.includes("application/json")) {
		return response.json() as Promise<T>;
	}
	return response.text() as unknown as T;
}
