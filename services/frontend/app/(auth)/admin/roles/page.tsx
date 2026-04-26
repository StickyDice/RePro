"use client";

import { apiFetch } from "@shared/api/client";
import { formatRoleLabel } from "@shared/lib/role-label";
import {
	getStoredCompanyId,
	NO_COMPANY_SELECTED_MESSAGE,
} from "@shared/lib/selected-company";
import { zodToFormikErrors } from "@shared/lib/zod-formik";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@shared/ui";
import { Field, Form, Formik } from "formik";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

interface Role {
	id: string;
	name: string;
	code: string;
	priority: number;
	description: string | null;
	is_system: boolean;
}

const createRoleSchema = z.object({
	name: z.string().min(1, "Название обязательно").max(100),
	code: z.string().min(1, "Код обязателен").max(50),
	priority: z.coerce.number().int().min(0, "Приоритет должен быть не меньше 0"),
	description: z.string().max(500).optional(),
});

type CreateRoleFormValues = z.infer<typeof createRoleSchema>;

export default function AdminRolesPage() {
	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const loadRoles = useCallback(async () => {
		const companyId = getStoredCompanyId();
		if (!companyId) {
			setRoles([]);
			setError(NO_COMPANY_SELECTED_MESSAGE);
			setLoading(false);
			return;
		}
		await apiFetch<{ roles: Role[] }>(`/companies/${companyId}/roles`)
			.then((data) => {
				setRoles(data.roles ?? []);
				setError(null);
			})
			.catch((err) =>
				setError(
					err instanceof Error ? err.message : "Не удалось загрузить данные",
				),
			)
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		void loadRoles();
	}, [loadRoles]);

	async function handleCreateRole(values: CreateRoleFormValues) {
		const companyId = getStoredCompanyId();
		if (!companyId) {
			throw new Error(NO_COMPANY_SELECTED_MESSAGE);
		}

		await apiFetch(`/companies/${companyId}/roles`, {
			method: "POST",
			body: JSON.stringify({
				name: values.name.trim(),
				code: values.code.trim(),
				priority: values.priority,
				description: values.description?.trim() || undefined,
			}),
		});
		await loadRoles();
		toast.success("Роль создана.");
	}

	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Управление ролями</h1>
				<div className="flex items-center gap-2">
					<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
						<DialogTrigger asChild>
							<Button>Добавить роль</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-2xl">
							<DialogHeader>
								<DialogTitle>Создать роль</DialogTitle>
								<DialogDescription>
									Администраторы компании могут добавлять собственные роли.
								</DialogDescription>
							</DialogHeader>
							<Formik<CreateRoleFormValues>
								initialValues={{
									name: "",
									code: "",
									priority: 0,
									description: "",
								}}
								validate={(values) =>
									zodToFormikErrors(createRoleSchema, values)
								}
								onSubmit={async (values, helpers) => {
									try {
										await handleCreateRole(values);
										helpers.resetForm();
										setCreateDialogOpen(false);
									} catch (err) {
										toast.error(
											err instanceof Error
												? err.message
												: "Не удалось создать роль",
										);
									} finally {
										helpers.setSubmitting(false);
									}
								}}
							>
								{({ errors, touched, isSubmitting }) => (
									<Form className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="name">Название</Label>
											<Field as={Input} id="name" name="name" />
											{touched.name && errors.name ? (
												<p className="text-sm text-destructive">
													{errors.name}
												</p>
											) : null}
										</div>
										<div className="space-y-2">
											<Label htmlFor="code">Код</Label>
											<Field as={Input} id="code" name="code" />
											{touched.code && errors.code ? (
												<p className="text-sm text-destructive">
													{errors.code}
												</p>
											) : null}
										</div>
										<div className="space-y-2">
											<Label htmlFor="priority">Приоритет</Label>
											<Field
												as={Input}
												id="priority"
												name="priority"
												type="number"
											/>
											{touched.priority && errors.priority ? (
												<p className="text-sm text-destructive">
													{errors.priority}
												</p>
											) : null}
										</div>
										<div className="space-y-2">
											<Label htmlFor="description">Описание</Label>
											<Field as={Input} id="description" name="description" />
											{touched.description && errors.description ? (
												<p className="text-sm text-destructive">
													{errors.description}
												</p>
											) : null}
										</div>
										<div className="md:col-span-2">
											<Button type="submit" disabled={isSubmitting}>
												{isSubmitting ? "Создание роли..." : "Добавить роль"}
											</Button>
										</div>
									</Form>
								)}
							</Formik>
						</DialogContent>
					</Dialog>
				</div>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Роли компании</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<Skeleton className="h-48 w-full" />
					) : error ? (
						<p className="text-destructive">{error}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Название</TableHead>
									<TableHead>Код</TableHead>
									<TableHead>Приоритет</TableHead>
									<TableHead>Системная</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{roles.map((r) => (
									<TableRow key={r.id}>
										<TableCell>{formatRoleLabel(r)}</TableCell>
										<TableCell>{r.code}</TableCell>
										<TableCell>{r.priority}</TableCell>
										<TableCell>
											{r.is_system ? (
												<Badge variant="secondary">Да</Badge>
											) : (
												<span className="text-muted-foreground">Нет</span>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
