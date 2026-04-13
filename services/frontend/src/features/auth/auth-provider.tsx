"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { createBrowserClient } from "@shared/lib/supabase";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextValue {
	session: Session | null;
	user: SupabaseUser | null;
	loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
	session: null,
	user: null,
	loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supabase = createBrowserClient();
		void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
			setSession(initialSession);
			setUser(initialSession?.user ?? null);
			setLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	return (
		<AuthContext.Provider value={{ session, user, loading }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
