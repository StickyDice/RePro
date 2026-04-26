"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/src/widgets/app-shell/app-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen bg-background">
			<AppSidebar />
			<div className="flex min-h-screen min-w-0 flex-1 flex-col">
				{children}
			</div>
		</div>
	);
}
