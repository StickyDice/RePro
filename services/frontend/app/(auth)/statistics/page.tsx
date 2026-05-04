"use client";

import { apiFetch } from "@shared/api/client";
import {
	getStoredCompanyId,
	NO_COMPANY_SELECTED_MESSAGE,
} from "@shared/lib/selected-company";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@shared/ui";
import { format, subMonths } from "date-fns";
import { useEffect, useState } from "react";

const defaultStart = format(subMonths(new Date(), 1), "yyyy-MM-dd");
const defaultEnd = format(new Date(), "yyyy-MM-dd");

type OverviewData = {
	totalResources: number;
	totalRentalsInPeriod: number;
	approvedCount: number;
	rejectedCount: number;
	uniqueUsers: number;
};

type BarDatum = {
	label: string;
	value: number;
	className: string;
};

function BarChart({ data }: { data: BarDatum[] }) {
	const max = Math.max(...data.map((item) => item.value), 1);

	return (
		<div className="space-y-4">
			{data.map((item) => {
				const width = `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%`;

				return (
					<div key={item.label} className="space-y-1.5">
						<div className="flex items-center justify-between gap-3 text-sm">
							<span className="text-muted-foreground">{item.label}</span>
							<span className="font-medium tabular-nums">{item.value}</span>
						</div>
						<div className="h-3 overflow-hidden rounded-full bg-muted">
							<div
								className={`h-full rounded-full ${item.className}`}
								style={{ width }}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
}

export default function StatisticsPage() {
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
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Статистика</h1>
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
				<div className="space-y-4">
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

					<div className="grid gap-4 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Бронирования по статусам</CardTitle>
							</CardHeader>
							<CardContent>
								<BarChart
									data={[
										{
											label: "Одобрено",
											value: overview.approvedCount,
											className: "bg-green-600",
										},
										{
											label: "Отклонено",
											value: overview.rejectedCount,
											className: "bg-red-600",
										},
										{
											label: "Остальные",
											value: Math.max(
												overview.totalRentalsInPeriod -
													overview.approvedCount -
													overview.rejectedCount,
												0,
											),
											className: "bg-sky-600",
										},
									]}
								/>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Активность за период</CardTitle>
							</CardHeader>
							<CardContent>
								<BarChart
									data={[
										{
											label: "Всего бронирований",
											value: overview.totalRentalsInPeriod,
											className: "bg-blue-600",
										},
										{
											label: "Уникальные пользователи",
											value: overview.uniqueUsers,
											className: "bg-violet-600",
										},
									]}
								/>
							</CardContent>
						</Card>
					</div>
				</div>
			) : null}
		</div>
	);
}
