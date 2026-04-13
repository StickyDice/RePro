"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { apiFetch } from "@shared/api/client";
import type { RentalRequest } from "@entities/rental-request/types";
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

const statusVariant: Record<
	RentalRequest["status"],
	"default" | "secondary" | "destructive" | "outline"
> = {
	pending: "outline",
	approved: "default",
	rejected: "destructive",
	cancelled: "secondary",
	completed: "secondary",
};

export function RentalQueue() {
	const [rentals, setRentals] = useState<RentalRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const companyId =
			typeof window !== "undefined" ? localStorage.getItem("companyId") : null;
		if (!companyId) return;
		apiFetch<{ rentals: RentalRequest[] }>(`/companies/${companyId}/rentals/my`)
			.then((data) => setRentals(data.rentals))
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
				<CardTitle>My rentals</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Resource</TableHead>
							<TableHead>Start</TableHead>
							<TableHead>End</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rentals.map((r) => (
							<TableRow key={r.id}>
								<TableCell className="font-medium">
									{r.resource?.name ?? r.resource_id}
								</TableCell>
								<TableCell>
									{format(
										new Date(r.requested_start_at),
										"MMM d, yyyy",
									)}
								</TableCell>
								<TableCell>
									{format(new Date(r.requested_end_at), "MMM d, yyyy")}
								</TableCell>
								<TableCell>
									<Badge variant={statusVariant[r.status]}>
										{r.status}
									</Badge>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				{rentals.length === 0 && (
					<p className="py-4 text-center text-muted-foreground">
						No rentals yet.{" "}
						<Link href="/resources" className="text-primary hover:underline">
							Browse resources
						</Link>
					</p>
				)}
			</CardContent>
		</Card>
	);
}
