"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { apiFetch } from "@shared/api/client";
import type { Resource } from "@entities/resource/types";
import { CreateRentalForm } from "@/src/features/rental/create-rental-form";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/src/features/auth/logout";

export default function ResourceDetailPage() {
	const params = useParams();
	const id = params.id as string;
	const [resource, setResource] = useState<Resource | null>(null);
	const [availability, setAvailability] = useState<Record<string, number>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const companyId =
			typeof window !== "undefined" ? localStorage.getItem("companyId") : null;
		if (!companyId) return;

		apiFetch<{ resource: Resource }>(`/companies/${companyId}/resources/${id}`)
			.then((data) => setResource(data.resource))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [id]);

	useEffect(() => {
		const companyId =
			typeof window !== "undefined" ? localStorage.getItem("companyId") : null;
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
						← Resources
					</Link>
					<h1 className="text-2xl font-bold">{resource.name}</h1>
				</div>
				<LogoutButton />
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<p>
							<span className="text-muted-foreground">Code:</span>{" "}
							{resource.code}
						</p>
						{resource.description && (
							<p>
								<span className="text-muted-foreground">Description:</span>{" "}
								{resource.description}
							</p>
						)}
						<p>
							<span className="text-muted-foreground">Availability:</span>{" "}
							<Badge>
								{resource.quantity_active}/{resource.quantity_total}
							</Badge>
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Availability calendar</CardTitle>
					</CardHeader>
					<CardContent>
						<Calendar
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
