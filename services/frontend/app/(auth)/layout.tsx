"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/features/auth/auth-provider";
import { apiFetch } from "@shared/api/client";
import type { User } from "@entities/user/types";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { session, loading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (loading) return;
		if (!session) {
			router.replace("/login");
			return;
		}

		apiFetch<{ user: User }>("/auth/me")
			.then((data) => {
				if (data.user.status === "pending_verification") {
					if (!pathname?.includes("/account-under-review")) {
						router.replace("/account-under-review");
					}
				}
			})
			.catch(() => {});
	}, [session, loading, router, pathname]);

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return <>{children}</>;
}
