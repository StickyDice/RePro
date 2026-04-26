"use client";

import { Button } from "@shared/ui";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/src/features/auth/auth-provider";
import { LogoutButton } from "@/src/features/auth/logout";
import { SelectCompany } from "@/src/features/auth/select-company";

export default function SelectCompanyPage() {
	const router = useRouter();
	const routerRef = useRef(router);
	routerRef.current = router;

	const {
		session,
		loading: authLoading,
		profile,
		profileLoading,
		profileError,
		refetchProfile,
	} = useAuth();

	useEffect(() => {
		if (authLoading || profileLoading || !profile) return;

		if (profile.status === "pending_verification") {
			routerRef.current.replace("/account-under-review");
			return;
		}

		const memberships = profile.memberships ?? [];

		// Platform admins manage companies via /dashboard + /platform/* and often have no tenant membership.
		if (profile.isPlatformAdmin && memberships.length === 0) {
			if (typeof window !== "undefined") {
				localStorage.removeItem("companyId");
			}
			routerRef.current.replace("/dashboard");
			return;
		}

		const companyId =
			typeof window !== "undefined" ? localStorage.getItem("companyId") : null;

		if (memberships.length === 1 && !companyId) {
			const companyIdToSet = memberships[0].company_id;
			localStorage.setItem("companyId", companyIdToSet);
			routerRef.current.replace("/dashboard");
		} else if (memberships.length > 0 && companyId) {
			const hasMembership = memberships.some((m) => m.company_id === companyId);
			if (hasMembership) {
				routerRef.current.replace("/dashboard");
			}
		}
	}, [authLoading, profileLoading, profile]);

	if (authLoading || profileLoading) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
				<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				<p className="text-muted-foreground">Загрузка...</p>
			</div>
		);
	}

	if (!session?.user?.id) {
		return null;
	}

	if (profileError) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
				<p className="text-destructive text-center text-sm">{profileError}</p>
				<p className="text-muted-foreground text-center text-sm">
					Проверьте, что API запущен, а сессия действительна.
				</p>
				<Button
					type="button"
					variant="outline"
					onClick={() => refetchProfile()}
				>
					Повторить
				</Button>
				<LogoutButton />
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-foreground">Профиль не загружен.</p>
				<LogoutButton />
			</div>
		);
	}

	if (profile.memberships.length === 0) {
		if (profile.isPlatformAdmin) {
			return (
				<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
					<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					<p className="text-muted-foreground">Открываем панель управления…</p>
				</div>
			);
		}
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-foreground">
					У вас пока нет привязанных компаний.
				</p>
				<LogoutButton />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
			<SelectCompany user={profile} />
			<LogoutButton />
		</div>
	);
}
