"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@shared/api/client";
import { LogoutButton } from "@/src/features/auth/logout";
import type { User } from "@entities/user/types";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@shared/ui";

interface CompanyApplication {
	id: string;
	company_name: string;
	inn: string;
	contact_email: string;
	contact_phone: string;
	contact_first_name: string;
	contact_last_name: string;
	contact_patronymic: string | null;
	selected_plan: string;
	payment_method: string;
	status: string;
	created_at: string;
}

export function PlatformCompanyApplications() {
	const [applications, setApplications] = useState<CompanyApplication[]>([]);
	const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [forbidden, setForbidden] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submittingId, setSubmittingId] = useState<string | null>(null);

	const loadApplications = async () => {
		try {
			const me = await apiFetch<{ user: User }>("/auth/me");
			if (!me.user?.isPlatformAdmin) {
				setForbidden(true);
				setApplications([]);
				return;
			}

			setForbidden(false);
			const data = await apiFetch<{ applications: CompanyApplication[] }>(
				"/platform/company-applications",
			);
			setApplications(data.applications ?? []);
			setError(null);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load";
			const status = (err as Error & { status?: number })?.status;
			if (status === 403) {
				setForbidden(true);
				setApplications([]);
				setError(null);
				return;
			}
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadApplications();
	}, []);

	const busyLabel = useMemo(() => {
		if (!submittingId) return null;
		return applications.find((application) => application.id === submittingId)
			?.company_name;
	}, [applications, submittingId]);

	const submitDecision = async (
		applicationId: string,
		action: "approve" | "reject",
	) => {
		setSubmittingId(applicationId);
		try {
			await apiFetch(`/platform/company-applications/${applicationId}/${action}`, {
				method: "PATCH",
				body: JSON.stringify({
					review_comment: reviewComments[applicationId]?.trim() || undefined,
				}),
			});
			toast.success(
				action === "approve"
					? "Application approved"
					: "Application rejected",
			);
			setReviewComments((current) => ({ ...current, [applicationId]: "" }));
			await loadApplications();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : `Failed to ${action} application`,
			);
		} finally {
			setSubmittingId(null);
		}
	};

	if (loading) {
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
						<h1 className="text-2xl font-bold">Company applications</h1>
					</div>
					<LogoutButton />
				</div>
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-56" />
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (forbidden) {
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
						<h1 className="text-2xl font-bold">Company applications</h1>
					</div>
					<LogoutButton />
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Platform admin access required</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							Only super admins from `PLATFORM_ADMIN_EMAILS` can review company
							applications.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

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
					<div>
						<h1 className="text-2xl font-bold">Company applications</h1>
						<p className="text-sm text-muted-foreground">
							Review and approve pending onboarding requests.
						</p>
					</div>
				</div>
				<LogoutButton />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Pending applications</CardTitle>
				</CardHeader>
				<CardContent>
					{error ? (
						<p className="text-destructive">{error}</p>
					) : applications.length === 0 ? (
						<p className="text-muted-foreground">
							No pending company applications.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Company</TableHead>
									<TableHead>Contact</TableHead>
									<TableHead>Plan</TableHead>
									<TableHead>Payment</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Review comment</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{applications.map((application) => {
									const fullName = [
										application.contact_last_name,
										application.contact_first_name,
										application.contact_patronymic,
									]
										.filter(Boolean)
										.join(" ");
									const isSubmitting = submittingId === application.id;

									return (
										<TableRow key={application.id}>
											<TableCell className="align-top">
												<div className="font-medium">{application.company_name}</div>
												<div className="text-sm text-muted-foreground">
													INN: {application.inn}
												</div>
											</TableCell>
											<TableCell className="align-top">
												<div>{fullName || "-"}</div>
												<div className="text-sm text-muted-foreground">
													{application.contact_email}
												</div>
												<div className="text-sm text-muted-foreground">
													{application.contact_phone}
												</div>
											</TableCell>
											<TableCell className="align-top">
												{application.selected_plan}
											</TableCell>
											<TableCell className="align-top">
												{application.payment_method}
											</TableCell>
											<TableCell className="align-top">
												<Badge variant="outline">{application.status}</Badge>
											</TableCell>
											<TableCell className="align-top">
												<Input
													value={reviewComments[application.id] ?? ""}
													onChange={(event) =>
														setReviewComments((current) => ({
															...current,
															[application.id]: event.target.value,
														}))
													}
													placeholder="Optional review note"
													disabled={isSubmitting}
												/>
											</TableCell>
											<TableCell className="align-top text-right">
												<div className="flex justify-end gap-2">
													<Button
														size="sm"
														onClick={() =>
															void submitDecision(application.id, "approve")
														}
														disabled={isSubmitting}
													>
														Approve
													</Button>
													<Button
														size="sm"
														variant="destructive"
														onClick={() =>
															void submitDecision(application.id, "reject")
														}
														disabled={isSubmitting}
													>
														Reject
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}

					{busyLabel ? (
						<p className="mt-4 text-sm text-muted-foreground">
							Processing application for {busyLabel}...
						</p>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
