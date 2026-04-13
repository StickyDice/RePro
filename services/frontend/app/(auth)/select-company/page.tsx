"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@shared/api/client";
import type { User } from "@entities/user/types";
import { SelectCompany } from "@/src/features/auth/select-company";
import { LogoutButton } from "@/src/features/auth/logout";

export default function SelectCompanyPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		apiFetch<{ user: User }>("/auth/me")
			.then((data) => {
				setUser(data.user);
				if (data.user.status === "pending_verification") {
					router.replace("/account-under-review");
					return;
				}
				const memberships = data.user.memberships ?? [];
				const companyId =
					typeof window !== "undefined"
						? localStorage.getItem("companyId")
						: null;

				if (memberships.length === 1 && !companyId) {
					const companyIdToSet = memberships[0].company_id;
					localStorage.setItem("companyId", companyIdToSet);
					router.replace("/dashboard");
				} else if (memberships.length > 0 && companyId) {
					const hasMembership = memberships.some(
						(m) => m.company_id === companyId,
					);
					if (hasMembership) {
						router.replace("/dashboard");
					}
				}
			})
			.catch(() => setLoading(false))
			.finally(() => setLoading(false));
	}, [router]);

	if (loading || !user) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
				<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (user.memberships.length === 0) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-foreground">
					You have no company memberships yet.
				</p>
				<LogoutButton />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
			<SelectCompany user={user} />
			<LogoutButton />
		</div>
	);
}
