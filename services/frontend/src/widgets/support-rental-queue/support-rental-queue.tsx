"use client";

import type { RentalRequest } from "@entities/rental-request/types";
import { apiFetch } from "@shared/api/client";
import {
	getStoredCompanyId,
	NO_COMPANY_SELECTED_MESSAGE,
} from "@shared/lib/selected-company";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@shared/ui";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export function SupportRentalQueue() {
	const [rentals, setRentals] = useState<RentalRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchRentals = () => {
		const companyId = getStoredCompanyId();
		if (!companyId) {
			setRentals([]);
			setError(NO_COMPANY_SELECTED_MESSAGE);
			setLoading(false);
			return;
		}
		apiFetch<{ rentals: RentalRequest[] }>(
			`/companies/${companyId}/rentals?status=pending`,
		)
			.then((data) => {
				setRentals(data.rentals ?? []);
				setError(null);
			})
			.catch((err) =>
				setError(
					err instanceof Error ? err.message : "Не удалось загрузить данные",
				),
			)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchRentals();
	}, []);

	const handleApprove = async (rentalId: string) => {
		const companyId = getStoredCompanyId();
		if (!companyId) return;
		try {
			await apiFetch(`/companies/${companyId}/rentals/${rentalId}/approve`, {
				method: "PATCH",
				body: JSON.stringify({}),
			});
			toast.success("Бронирование одобрено");
			fetchRentals();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Не удалось одобрить бронирование",
			);
		}
	};

	const handleReject = async (rentalId: string) => {
		const companyId = getStoredCompanyId();
		if (!companyId) return;
		try {
			await apiFetch(`/companies/${companyId}/rentals/${rentalId}/reject`, {
				method: "PATCH",
				body: JSON.stringify({ decision_comment: "Отклонено поддержкой" }),
			});
			toast.success("Бронирование отклонено");
			fetchRentals();
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Не удалось отклонить бронирование",
			);
		}
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
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
				<CardTitle>Поддержка: ожидающие заявки на бронирование</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Ресурс</TableHead>
							<TableHead>Заявитель</TableHead>
							<TableHead>Начало</TableHead>
							<TableHead>Окончание</TableHead>
							<TableHead>Статус</TableHead>
							<TableHead className="text-right">Действия</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rentals.map((r) => (
							<TableRow key={r.id}>
								<TableCell className="font-medium">
									{r.resource?.name ?? r.resource_id}
								</TableCell>
								<TableCell>{r.user?.email ?? r.user_id}</TableCell>
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
								<TableCell className="text-right">
									{r.status === "pending" && (
										<div className="flex justify-end gap-2">
											<Button
												size="sm"
												variant="default"
												onClick={() => handleApprove(r.id)}
											>
												Одобрить
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onClick={() => handleReject(r.id)}
											>
												Отклонить
											</Button>
										</div>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				{rentals.length === 0 && (
					<p className="py-4 text-center text-muted-foreground">
						Нет ожидающих заявок на бронирование.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
