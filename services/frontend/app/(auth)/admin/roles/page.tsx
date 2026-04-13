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

interface Role {
	id: string;
	name: string;
	code: string;
	priority: number;
	description: string | null;
	is_system: boolean;
}

export default function AdminRolesPage() {
	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const companyId = localStorage.getItem("companyId");
		if (!companyId) return;
		apiFetch<{ roles: Role[] }>(`/companies/${companyId}/roles`)
			.then((data) => setRoles(data.roles ?? []))
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
					<h1 className="text-2xl font-bold">Manage roles</h1>
				</div>
				<LogoutButton />
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Company roles</CardTitle>
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
									<TableHead>Code</TableHead>
									<TableHead>Priority</TableHead>
									<TableHead>System</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{roles.map((r) => (
									<TableRow key={r.id}>
										<TableCell>{r.name}</TableCell>
										<TableCell>{r.code}</TableCell>
										<TableCell>{r.priority}</TableCell>
										<TableCell>
											{r.is_system ? (
												<Badge variant="secondary">Yes</Badge>
											) : (
												<span className="text-muted-foreground">No</span>
											)}
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
