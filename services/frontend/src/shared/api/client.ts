import { createBrowserClient as getSupabase } from "@shared/lib/supabase";

const baseURL =
	typeof window !== "undefined"
		? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
		: "";

export async function getAuthHeaders(): Promise<Record<string, string>> {
	const supabase = getSupabase();
	const {
		data: { session },
	} = await supabase.auth.getSession();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (session?.access_token) {
		headers["Authorization"] = `Bearer ${session.access_token}`;
	}
	const companyId =
		typeof window !== "undefined"
			? localStorage.getItem("companyId")
			: null;
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
			error = new Error(json.message ?? text ?? "Request failed");
		} catch {
			error = new Error(text || response.statusText || "Request failed");
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
