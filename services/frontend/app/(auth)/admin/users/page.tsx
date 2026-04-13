"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@shared/api/client";
import { LogoutButton } from "@/src/features/auth/logout";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Badge,
	Skeleton,
} from "@shared/ui";

interface Member {
	id: string;
	user_id: string;
	role_id: string;
	status: string;
	user: {
		email: string | null;
		first_name: string | null;
		last_name: string | null;
		phone_number: string | null;
	};
	role: { name: string; code: string };
}

export default function AdminUsersPage() {
	const [members, setMembers] = useState<Member[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const companyId = localStorage.getItem("companyId");
		if (!companyId) return;
		apiFetch<{ members: Member[] }>(`/companies/${companyId}/members`)
			.then((data) => setMembers(data.members ?? []))
			.catch((err) =>
				setError(err instanceof Error ? err.message : "Failed to load"),
			)
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link
						href="/dashboard"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						← Dashboard
					</Link>
					<h1 className="text-2xl font-bold">Manage users</h1>
				</div>
				<LogoutButton />
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Company members</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<Skeleton className="h-48 w-full" />
					) : error ? (
						<p className="text-destructive">{error}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{members.map((m) => (
									<TableRow key={m.id}>
										<TableCell>
											{m.user?.first_name} {m.user?.last_name}
										</TableCell>
										<TableCell>{m.user?.email ?? "-"}</TableCell>
										<TableCell>{m.role?.name ?? m.role?.code}</TableCell>
										<TableCell>
											<Badge variant="outline">{m.status}</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
