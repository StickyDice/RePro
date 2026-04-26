"use client";

import type { User } from "@entities/user/types";
import {
	getActiveMembership,
	hasMinRole,
	ROLE_PRIORITIES,
} from "@shared/lib/role-access";
import type { LucideIcon } from "lucide-react";
import {
	BarChart3,
	Building2,
	CalendarDays,
	Database,
	Headset,
	Package,
	Settings,
	Shield,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/src/features/auth/auth-provider";
import { LogoutButton } from "@/src/features/auth/logout";

const APP_NAME = "RePro";

type NavItem =
	| {
			kind: "internal";
			label: string;
			href: string;
			icon: LucideIcon;
			exact?: boolean;
	  }
	| {
			kind: "external";
			label: string;
			href: string;
			icon: LucideIcon;
	  };

type NavDefinition = NavItem & {
	visible: (profile: User) => boolean;
};

function isActive(pathname: string, item: NavItem): boolean {
	if (item.kind === "external") return false;
	if (item.exact) {
		return pathname === item.href;
	}
	return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppSidebar() {
	const pathname = usePathname() ?? "";
	const { profile, profileLoading } = useAuth();

	const supabaseStudioUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

	const navDefinitions: NavDefinition[] = useMemo(
		() => [
			{
				kind: "internal",
				label: "Настройки профиля",
				href: "/profile",
				icon: Settings,
				visible: () => true,
			},
			{
				kind: "internal",
				label: "Поддержка: очередь заявок",
				href: "/support/rentals",
				icon: Headset,
				visible: (p: User) => hasMinRole(p, ROLE_PRIORITIES.support),
			},
			{
				kind: "internal",
				label: "Управление пользователями",
				href: "/admin/users",
				icon: Users,
				visible: (p: User) => hasMinRole(p, ROLE_PRIORITIES.moderator),
			},
			{
				kind: "internal",
				label: "Управление ролями",
				href: "/admin/roles",
				icon: Shield,
				visible: (p: User) => hasMinRole(p, ROLE_PRIORITIES.company_admin),
			},
			{
				kind: "internal",
				label: "Управление ресурсами",
				href: "/admin/resources",
				icon: Package,
				visible: (p: User) => hasMinRole(p, ROLE_PRIORITIES.moderator),
			},
			{
				kind: "internal",
				label: "Администратор платформы: заявки",
				href: "/platform/company-applications",
				icon: Building2,
				visible: (p: User) => p.isPlatformAdmin === true,
			},
			{
				kind: "internal",
				label: "Статистика",
				href: "/statistics",
				icon: BarChart3,
				visible: (p: User) => hasMinRole(p, ROLE_PRIORITIES.moderator),
			},
			{
				kind: "internal",
				label: "Календарь моих бронирований",
				href: "/calendar",
				icon: CalendarDays,
				visible: (p: User) => getActiveMembership(p) !== null,
			},
			...(supabaseStudioUrl
				? [
						{
							kind: "external" as const,
							label: "Supabase Studio (база данных и авторизация)",
							href: supabaseStudioUrl,
							icon: Database,
							visible: (p: User) => p.isPlatformAdmin === true,
						},
					]
				: []),
		],
		[supabaseStudioUrl],
	);

	const navItems = useMemo(() => {
		if (!profile) {
			return [];
		}
		return navDefinitions.filter((def) => def.visible(profile));
	}, [profile, navDefinitions]);

	return (
		<aside className="flex h-screen w-[280px] shrink-0 flex-col border-r border-border bg-white px-3 py-6">
			<Link
				href="/dashboard"
				className="mb-8 w-fit px-3 text-xl font-bold tracking-tight text-foreground"
			>
				{APP_NAME}
			</Link>

			<nav className="flex flex-1 flex-col gap-1 overflow-y-auto text-[14px] leading-snug">
				{profileLoading ? (
					<div className="flex items-center justify-center px-3 py-8">
						<div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					</div>
				) : (
					navItems.map((item) => {
						const Icon = item.icon;
						const active = isActive(pathname, item);
						const className = cn(
							"flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 font-medium text-neutral-800 transition-colors hover:border-neutral-200 hover:bg-neutral-50",
							active &&
								"border-sky-200/80 bg-sky-50 text-sky-700 hover:border-sky-200/80 hover:bg-sky-50 hover:text-sky-700",
						);
						const iconClass = cn(
							"mt-0.5 size-5 shrink-0 stroke-[1.75]",
							active ? "text-sky-600" : "text-neutral-600",
						);

						if (item.kind === "external") {
							return (
								<a
									key={item.label}
									href={item.href}
									target="_blank"
									rel="noopener noreferrer"
									className={className}
								>
									<Icon className={iconClass} aria-hidden />
									<span className="min-w-0 break-words">{item.label}</span>
								</a>
							);
						}

						return (
							<Link key={item.href} href={item.href} className={className}>
								<Icon className={iconClass} aria-hidden />
								<span className="min-w-0 break-words">{item.label}</span>
							</Link>
						);
					})
				)}
			</nav>

			<div className="mt-4 border-t border-border pt-4">
				<LogoutButton
					className="w-full justify-start text-[14px] font-medium text-neutral-700"
					variant="ghost"
				/>
			</div>
		</aside>
	);
}
