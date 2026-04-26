import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let browserClient: SupabaseClient | null = null;

/**
 * Single browser client. Creating a new `createClient()` on every `apiFetch` caused
 * multiple GoTrue instances and unstable auth + repeated session work.
 */
export function createBrowserClient(): SupabaseClient {
	if (typeof window === "undefined") {
		return createClient(supabaseUrl, supabaseAnonKey);
	}
	if (!browserClient) {
		browserClient = createClient(supabaseUrl, supabaseAnonKey);
	}
	return browserClient;
}
