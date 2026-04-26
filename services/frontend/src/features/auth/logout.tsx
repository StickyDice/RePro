"use client";

import { createBrowserClient } from "@shared/lib/supabase";
import { Button } from "@shared/ui";
import { useRouter } from "next/navigation";

export function LogoutButton() {
	const router = useRouter();

	async function handleLogout() {
		const supabase = createBrowserClient();
		await supabase.auth.signOut();
		if (typeof window !== "undefined") {
			localStorage.removeItem("companyId");
		}
		router.push("/");
		router.refresh();
	}

	return (
		<Button variant="outline" onClick={handleLogout}>
			Выйти
		</Button>
	);
}
