"use client";

import { apiFetch } from "@shared/api/client";
import {
	getStoredCompanyId,
	NO_COMPANY_SELECTED_MESSAGE,
} from "@shared/lib/selected-company";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@shared/ui";
import { format, subMonths } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/src/features/auth/logout";

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
		const companyId = getStoredCompanyId();
		if (!companyId) {
			setOverview(null);
			setError(NO_COMPANY_SELECTED_MESSAGE);
			setLoading(false);
			return;
		}
		apiFetch<OverviewData>(
			`/companies/${companyId}/statistics/overview?startDate=${defaultStart}&endDate=${defaultEnd}`,
		)
			.then((d) => {
				setOverview(d);
				setError(null);
			})
			.catch((err) =>
				setError(
					err instanceof Error ? err.message : "Не удалось загрузить данные",
				),
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
						← Панель управления
					</Link>
					<h1 className="text-2xl font-bold">Статистика</h1>
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
								Всего ресурсов
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">{overview.totalResources}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">
								Бронирований за период
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">
								{overview.totalRentalsInPeriod}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">Одобрено</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold text-green-600">
								{overview.approvedCount}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">Отклонено</CardTitle>
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
