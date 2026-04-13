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
	Button,
	Skeleton,
} from "@shared/ui";
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

export function SupportRentalQueue() {
	const [rentals, setRentals] = useState<RentalRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchRentals = () => {
		const companyId =
			typeof window !== "undefined" ? localStorage.getItem("companyId") : null;
		if (!companyId) return;
		apiFetch<{ rentals: RentalRequest[] }>(
			`/companies/${companyId}/rentals?status=pending`,
		)
			.then((data) => setRentals(data.rentals ?? []))
			.catch((err) =>
				setError(err instanceof Error ? err.message : "Failed to load"),
			)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchRentals();
	}, []);

	const handleApprove = async (rentalId: string) => {
		const companyId = localStorage.getItem("companyId");
		if (!companyId) return;
		try {
			await apiFetch(`/companies/${companyId}/rentals/${rentalId}/approve`, {
				method: "PATCH",
				body: JSON.stringify({}),
			});
			toast.success("Rental approved");
			fetchRentals();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to approve");
		}
	};

	const handleReject = async (rentalId: string) => {
		const companyId = localStorage.getItem("companyId");
		if (!companyId) return;
		try {
			await apiFetch(`/companies/${companyId}/rentals/${rentalId}/reject`, {
				method: "PATCH",
				body: JSON.stringify({ decision_comment: "Rejected by support" }),
			});
			toast.success("Rental rejected");
			fetchRentals();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to reject");
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
				<CardTitle>Support: Pending rental requests</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Resource</TableHead>
							<TableHead>Requester</TableHead>
							<TableHead>Start</TableHead>
							<TableHead>End</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rentals.map((r) => (
							<TableRow key={r.id}>
								<TableCell className="font-medium">
									{r.resource?.name ?? r.resource_id}
								</TableCell>
								<TableCell>
									{r.user?.email ?? r.user_id}
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
									<Badge variant={statusVariant[r.status]}>{r.status}</Badge>
								</TableCell>
								<TableCell className="text-right">
									{r.status === "pending" && (
										<div className="flex justify-end gap-2">
											<Button
												size="sm"
												variant="default"
												onClick={() => handleApprove(r.id)}
											>
												Approve
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onClick={() => handleReject(r.id)}
											>
												Reject
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
						No pending rental requests.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
