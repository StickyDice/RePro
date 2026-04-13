"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, subMonths } from "date-fns";
import { apiFetch } from "@shared/api/client";
import { LogoutButton } from "@/src/features/auth/logout";
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from "@shared/ui";

const defaultStart = format(subMonths(new Date(), 1), "yyyy-MM-dd");
const defaultEnd = format(new Date(), "yyyy-MM-dd");

export default function StatisticsPage() {
	type OverviewData = {
		totalResources: number;
		totalRentalsInPeriod: number;
		approvedCount: number;
		rejectedCount: number;
		uniqueUsers: number;
	};
	const [overview, setOverview] = useState<OverviewData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const companyId = localStorage.getItem("companyId");
		if (!companyId) return;
		apiFetch<OverviewData>(
			`/companies/${companyId}/statistics/overview?startDate=${defaultStart}&endDate=${defaultEnd}`,
		)
			.then((d) => setOverview(d))
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
					<h1 className="text-2xl font-bold">Statistics</h1>
				</div>
				<LogoutButton />
			</div>
			{loading ? (
				<Skeleton className="h-48 w-full" />
			) : error ? (
				<Card>
					<CardContent className="pt-6">
						<p className="text-destructive">{error}</p>
					</CardContent>
				</Card>
			) : overview ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">
								Total resources
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">{overview.totalResources}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">
								Rentals (period)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">{overview.totalRentalsInPeriod}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">Approved</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold text-green-600">
								{overview.approvedCount}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">Rejected</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold text-red-600">
								{overview.rejectedCount}
							</p>
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	);
}
