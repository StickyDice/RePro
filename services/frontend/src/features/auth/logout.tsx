"use client";

import { createBrowserClient } from "@shared/lib/supabase";
import { Button } from "@shared/ui";
import { useRouter } from "next/navigation";
import type { ButtonProps } from "@/components/ui/button";

export function LogoutButton({
	children,
	variant = "outline",
	...props
}: ButtonProps) {
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
		<Button variant={variant} onClick={handleLogout} {...props}>
			{children ?? "Выйти"}
		</Button>
	);
}
