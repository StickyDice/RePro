"use client";

import type { RentalRequest } from "@entities/rental-request/types";
import { apiFetch } from "@shared/api/client";
import {
	getStoredCompanyId,
	NO_COMPANY_SELECTED_MESSAGE,
} from "@shared/lib/selected-company";
import {
	filterBySearch,
	type SortDirection,
	sortByColumn,
	toggleSortColumn,
} from "@shared/lib/client-table";
import { SortableTableHead } from "@shared/ui/sortable-table-head";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableRow,
} from "@shared/ui";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

const statusLabel: Record<RentalRequest["status"], string> = {
	pending: "Ожидает",
	approved: "Одобрено",
	rejected: "Отклонено",
	cancelled: "Отменено",
	completed: "Завершено",
};

type MyRentalSortKey = "resource" | "start" | "end" | "status";

export function RentalQueue() {
	const [rentals, setRentals] = useState<RentalRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortKey, setSortKey] = useState<MyRentalSortKey | null>(null);
	const [sortDir, setSortDir] = useState<SortDirection>("asc");

	useEffect(() => {
		const companyId = getStoredCompanyId();
		if (!companyId) {
			setRentals([]);
			setError(NO_COMPANY_SELECTED_MESSAGE);
			setLoading(false);
			return;
		}
		apiFetch<{ rentals: RentalRequest[] }>(`/companies/${companyId}/rentals/my`)
			.then((data) => {
				setRentals(data.rentals);
				setError(null);
			})
			.catch((err) =>
				setError(
					err instanceof Error ? err.message : "Не удалось загрузить данные",
				),
			)
			.finally(() => setLoading(false));
	}, []);

	const visibleRentals = useMemo(() => {
		const searched = filterBySearch(rentals, searchQuery, (r) =>
			[
				r.resource?.name ?? r.resource_id,
				format(new Date(r.requested_start_at), "MMM d, yyyy", {
					locale: ru,
				}),
				format(new Date(r.requested_end_at), "MMM d, yyyy", {
					locale: ru,
				}),
				statusLabel[r.status],
			].join(" "),
		);
		return sortByColumn(searched, sortKey, sortDir, (r, key) => {
			switch (key) {
				case "resource":
					return r.resource?.name ?? r.resource_id;
				case "start":
					return new Date(r.requested_start_at).getTime();
				case "end":
					return new Date(r.requested_end_at).getTime();
				case "status":
					return statusLabel[r.status];
				default:
					return "";
			}
		});
	}, [rentals, searchQuery, sortKey, sortDir]);

	function handleSort(columnKey: string) {
		const next = toggleSortColumn(sortKey, sortDir, columnKey as MyRentalSortKey);
		setSortKey(next.sortKey);
		setSortDir(next.sortDir);
	}

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
				<CardTitle>Мои бронирования</CardTitle>
			</CardHeader>
			<CardContent>
				<Input
					placeholder="Поиск по таблице…"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="mb-4 max-w-sm"
				/>
				<Table>
					<TableHeader>
						<TableRow>
							<SortableTableHead
								label="Ресурс"
								columnKey="resource"
								activeKey={sortKey}
								direction={sortDir}
								onSort={handleSort}
							/>
							<SortableTableHead
								label="Начало"
								columnKey="start"
								activeKey={sortKey}
								direction={sortDir}
								onSort={handleSort}
							/>
							<SortableTableHead
								label="Окончание"
								columnKey="end"
								activeKey={sortKey}
								direction={sortDir}
								onSort={handleSort}
							/>
							<SortableTableHead
								label="Статус"
								columnKey="status"
								activeKey={sortKey}
								direction={sortDir}
								onSort={handleSort}
							/>
						</TableRow>
					</TableHeader>
					<TableBody>
						{visibleRentals.map((r) => (
							<TableRow key={r.id}>
								<TableCell className="font-medium">
									{r.resource?.name ?? r.resource_id}
								</TableCell>
								<TableCell>
									{format(new Date(r.requested_start_at), "MMM d, yyyy", {
										locale: ru,
									})}
								</TableCell>
								<TableCell>
									{format(new Date(r.requested_end_at), "MMM d, yyyy", {
										locale: ru,
									})}
								</TableCell>
								<TableCell>
									<Badge variant={statusVariant[r.status]}>
										{statusLabel[r.status]}
									</Badge>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				{rentals.length > 0 && visibleRentals.length === 0 ? (
					<p className="py-4 text-center text-muted-foreground">
						Ничего не найдено.
					</p>
				) : null}
				{rentals.length === 0 && (
					<p className="py-4 text-center text-muted-foreground">
						Пока бронирований нет.{" "}
						<Link href="/resources" className="text-primary hover:underline">
							Открыть ресурсы
						</Link>
					</p>
				)}
			</CardContent>
		</Card>
	);
}
