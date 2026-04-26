"use client";

import type { User as ApiUser } from "@entities/user/types";
import { apiFetch } from "@shared/api/client";
import { setBrowserAccessToken } from "@shared/lib/auth-access-token";
import { createBrowserClient } from "@shared/lib/supabase";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

interface AuthContextValue {
	session: Session | null;
	user: SupabaseUser | null;
	loading: boolean;
	/** Nest `/auth/me` profile — loaded once per Supabase user id (no per-page `/auth/me` loops). */
	profile: ApiUser | null;
	profileLoading: boolean;
	profileError: string | null;
	refetchProfile: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<ApiUser | null>(null);
	const [profileLoading, setProfileLoading] = useState(false);
	const [profileError, setProfileError] = useState<string | null>(null);
	const [profileRefreshNonce, setProfileRefreshNonce] = useState(0);

	/** Set only after `/auth/me` succeeds for this Supabase auth user id. */
	const profileLoadedForSupabaseId = useRef<string | null>(null);

	useEffect(() => {
		const supabase = createBrowserClient();
		void supabase.auth
			.getSession()
			.then(({ data: { session: initialSession } }) => {
				setBrowserAccessToken(initialSession?.access_token ?? null);
				setSession(initialSession);
				setUser(initialSession?.user ?? null);
				setLoading(false);
			});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setBrowserAccessToken(nextSession?.access_token ?? null);
			setSession(nextSession);
			setUser(nextSession?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		if (loading) return;

		if (!session?.user?.id) {
			profileLoadedForSupabaseId.current = null;
			setProfile(null);
			setProfileLoading(false);
			setProfileError(null);
			return;
		}

		const supabaseUserId = session.user.id;

		if (profileLoadedForSupabaseId.current === supabaseUserId) {
			return;
		}

		setProfileLoading(true);
		setProfileError(null);

		let cancelled = false;

		void apiFetch<{ user: ApiUser }>("/auth/me")
			.then((data) => {
				if (cancelled) return;
				profileLoadedForSupabaseId.current = supabaseUserId;
				setProfile(data.user);
				setProfileError(null);
			})
			.catch((err) => {
				if (cancelled) return;
				setProfile(null);
				setProfileError(
					err instanceof Error ? err.message : "Не удалось загрузить профиль",
				);
			})
			.finally(() => {
				if (!cancelled) setProfileLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [loading, session?.user?.id, profileRefreshNonce]);

	const refetchProfile = useCallback(() => {
		profileLoadedForSupabaseId.current = null;
		setProfileRefreshNonce((n) => n + 1);
	}, []);

	const value = useMemo(
		() => ({
			session,
			user,
			loading,
			profile,
			profileLoading,
			profileError,
			refetchProfile,
		}),
		[
			session,
			user,
			loading,
			profile,
			profileLoading,
			profileError,
			refetchProfile,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth должен использоваться внутри AuthProvider");
	}
	return ctx;
}
