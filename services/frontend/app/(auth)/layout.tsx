"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/src/features/auth/auth-provider";
import { AppShell } from "@/src/widgets/app-shell/app-shell";

function PendingVerificationRedirect() {
	const { profile, profileLoading, loading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const pathnameRef = useRef(pathname);
	pathnameRef.current = pathname;
	const routerRef = useRef(router);
	routerRef.current = router;

	useEffect(() => {
		if (loading || profileLoading || !profile) return;
		if (profile.status !== "pending_verification") return;
		const path = pathnameRef.current ?? "";
		if (!path.includes("/account-under-review")) {
			routerRef.current.replace("/account-under-review");
		}
	}, [loading, profileLoading, profile]);

	return null;
}

/**
 * Session gate only. Profile (`/auth/me`) is loaded once in AuthProvider.
 */
export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { session, loading } = useAuth();
	const router = useRouter();
	const routerRef = useRef(router);
	routerRef.current = router;

	useEffect(() => {
		if (loading) return;
		if (!session?.user?.id) {
			routerRef.current.replace("/login");
		}
	}, [loading, session?.user?.id]);

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

	return (
		<>
			<PendingVerificationRedirect />
			<AppShell>{children}</AppShell>
		</>
	);
}
