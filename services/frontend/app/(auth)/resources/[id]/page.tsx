"use client";

import type { Resource } from "@entities/resource/types";
import { apiFetch } from "@shared/api/client";
import {
	getStoredCompanyId,
	NO_COMPANY_SELECTED_MESSAGE,
} from "@shared/lib/selected-company";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/src/features/auth/logout";
import { CreateRentalForm } from "@/src/features/rental/create-rental-form";

export default function ResourceDetailPage() {
	const params = useParams();
	const id = params.id as string;
	const [resource, setResource] = useState<Resource | null>(null);
	const [availability, setAvailability] = useState<Record<string, number>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const companyId = getStoredCompanyId();
		if (!companyId) {
			setResource(null);
			setError(NO_COMPANY_SELECTED_MESSAGE);
			setLoading(false);
			return;
		}

		apiFetch<{ resource: Resource }>(`/companies/${companyId}/resources/${id}`)
			.then((data) => {
				setResource(data.resource);
				setError(null);
			})
			.catch((err) =>
				setError(
					err instanceof Error ? err.message : "Не удалось загрузить ресурс",
				),
			)
			.finally(() => setLoading(false));
	}, [id]);

	useEffect(() => {
		const companyId = getStoredCompanyId();
		if (!companyId || !resource) return;

		const start = startOfMonth(new Date());
		const end = endOfMonth(addMonths(new Date(), 2));
		apiFetch<{ availability: Record<string, number> }>(
			`/companies/${companyId}/resources/${id}/availability?startDate=${format(start, "yyyy-MM-dd")}&endDate=${format(end, "yyyy-MM-dd")}`,
		)
			.then((data) => setAvailability(data.availability))
			.catch(() => {});
	}, [id, resource]);

	if (loading || !resource) {
		if (!loading && error) {
			return (
				<div className="container py-8">
					<div className="mb-6 flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Link
								href="/resources"
								className="text-sm text-muted-foreground hover:text-foreground"
							>
								← Ресурсы
							</Link>
							<h1 className="text-2xl font-bold">Ресурс</h1>
						</div>
						<LogoutButton />
					</div>
					<Card>
						<CardContent className="pt-6">
							<p className="text-destructive">{error}</p>
						</CardContent>
					</Card>
				</div>
			);
		}

		return (
			<div className="container py-8">
				<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link
						href="/resources"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						← Ресурсы
					</Link>
					<h1 className="text-2xl font-bold">{resource.name}</h1>
				</div>
				<LogoutButton />
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Детали</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<p>
							<span className="text-muted-foreground">Код:</span>{" "}
							{resource.code}
						</p>
						{resource.description && (
							<p>
								<span className="text-muted-foreground">Описание:</span>{" "}
								{resource.description}
							</p>
						)}
						<p>
							<span className="text-muted-foreground">Доступность:</span>{" "}
							<Badge>
								{resource.quantity_active}/{resource.quantity_total}
							</Badge>
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Календарь доступности</CardTitle>
					</CardHeader>
					<CardContent>
						<Calendar
							locale={ru}
							disabled={(date) => {
								const key = format(date, "yyyy-MM-dd");
								return (availability[key] ?? 0) < 1;
							}}
						/>
					</CardContent>
				</Card>
			</div>

			<div className="mt-6">
				<CreateRentalForm resourceId={resource.id} />
			</div>
		</div>
	);
}
