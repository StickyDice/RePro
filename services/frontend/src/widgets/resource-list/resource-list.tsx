"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@shared/api/client";
import type { Resource } from "@entities/resource/types";
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

export function ResourceList() {
	const [resources, setResources] = useState<Resource[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const companyId =
			typeof window !== "undefined" ? localStorage.getItem("companyId") : null;
		if (!companyId) return;
		apiFetch<{ resources: Resource[] }>(
			`/companies/${companyId}/resources`,
		)
			.then((data) => setResources(data.resources))
			.catch((err) => setError(err instanceof Error ? err.message : "Failed"))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">{error}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Resources</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Code</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Availability</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{resources.map((r) => (
							<TableRow key={r.id}>
								<TableCell className="font-medium">{r.name}</TableCell>
								<TableCell>{r.code}</TableCell>
								<TableCell>{r.category ?? "—"}</TableCell>
								<TableCell>
									<Badge variant={r.quantity_active > 0 ? "default" : "secondary"}>
										{r.quantity_active}/{r.quantity_total}
									</Badge>
								</TableCell>
								<TableCell>
									<Link
										href={`/resources/${r.id}`}
										className="text-primary hover:underline"
									>
										View
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				{resources.length === 0 && (
					<p className="py-4 text-center text-muted-foreground">
						No resources found.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
