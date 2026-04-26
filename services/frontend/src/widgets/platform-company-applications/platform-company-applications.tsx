"use client";

import { apiFetch } from "@shared/api/client";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/src/features/auth/auth-provider";

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

interface ApplicationDecisionResult {
	authAccount?: {
		email: string;
		created: boolean;
		initialPassword: string | null;
	};
}

const applicationStatusLabel: Record<string, string> = {
	pending: "Ожидает",
	approved: "Одобрена",
	rejected: "Отклонена",
};

const planLabel: Record<string, string> = {
	basic: "Базовый",
	pro: "Профессиональный",
	enterprise: "Корпоративный",
};

export function PlatformCompanyApplications() {
	const { profile, profileLoading, profileError } = useAuth();
	const [applications, setApplications] = useState<CompanyApplication[]>([]);
	const [reviewComments, setReviewComments] = useState<Record<string, string>>(
		{},
	);
	const [loading, setLoading] = useState(true);
	const [forbidden, setForbidden] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submittingId, setSubmittingId] = useState<string | null>(null);

	const loadApplications = useCallback(async () => {
		setLoading(true);
		try {
			if (!profile?.isPlatformAdmin) {
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
			const message =
				err instanceof Error ? err.message : "Не удалось загрузить данные";
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
	}, [profile]);

	useEffect(() => {
		if (profileLoading) return;
		if (profileError) {
			setLoading(false);
			setError(profileError);
			return;
		}
		if (!profile) {
			setLoading(false);
			return;
		}
		void loadApplications();
	}, [profile, profileLoading, profileError, loadApplications]);

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
			const result = await apiFetch<ApplicationDecisionResult>(
				`/platform/company-applications/${applicationId}/${action}`,
				{
					method: "PATCH",
					body: JSON.stringify({
						review_comment: reviewComments[applicationId]?.trim() || undefined,
					}),
				},
			);
			if (action === "approve") {
				toast.success(
					result.authAccount?.created
						? "Заявка одобрена. Начальный пароль совпадает с email для входа."
						: "Заявка одобрена. Для этого email сохранён существующий вход.",
				);
			} else {
				toast.success("Заявка отклонена");
			}
			setReviewComments((current) => ({ ...current, [applicationId]: "" }));
			await loadApplications();
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: action === "approve"
						? "Не удалось одобрить заявку"
						: "Не удалось отклонить заявку",
			);
		} finally {
			setSubmittingId(null);
		}
	};

	if (loading) {
		return (
			<div className="container py-8">
				<div className="mb-6">
					<h1 className="text-2xl font-bold">Заявки компаний</h1>
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
				<div className="mb-6">
					<h1 className="text-2xl font-bold">Заявки компаний</h1>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Требуется доступ администратора платформы</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							Только супер-администраторы из `PLATFORM_ADMIN_EMAILS` могут
							рассматривать заявки компаний.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Заявки компаний</h1>
				<p className="text-sm text-muted-foreground">
					Проверяйте и одобряйте ожидающие заявки на подключение.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Ожидающие заявки</CardTitle>
				</CardHeader>
				<CardContent>
					{error ? (
						<p className="text-destructive">{error}</p>
					) : applications.length === 0 ? (
						<p className="text-muted-foreground">
							Нет ожидающих заявок от компаний.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Компания</TableHead>
									<TableHead>Контакт</TableHead>
									<TableHead>Тариф</TableHead>
									<TableHead>Оплата</TableHead>
									<TableHead>Статус</TableHead>
									<TableHead>Комментарий</TableHead>
									<TableHead className="text-right">Действия</TableHead>
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
												<div className="font-medium">
													{application.company_name}
												</div>
												<div className="text-sm text-muted-foreground">
													ИНН: {application.inn}
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
												{planLabel[application.selected_plan] ??
													application.selected_plan}
											</TableCell>
											<TableCell className="align-top">
												{application.payment_method}
											</TableCell>
											<TableCell className="align-top">
												<Badge variant="outline">
													{applicationStatusLabel[application.status] ??
														application.status}
												</Badge>
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
													placeholder="Необязательный комментарий"
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
														Одобрить
													</Button>
													<Button
														size="sm"
														variant="destructive"
														onClick={() =>
															void submitDecision(application.id, "reject")
														}
														disabled={isSubmitting}
													>
														Отклонить
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
							Обрабатывается заявка для компании {busyLabel}...
						</p>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
