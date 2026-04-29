"use client";

import type { Resource } from "@entities/resource/types";
import { apiFetch } from "@shared/api/client";
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
import {
	filterBySearch,
	type SortDirection,
	sortByColumn,
	toggleSortColumn,
} from "@shared/lib/client-table";
import { SortableTableHead } from "@shared/ui/sortable-table-head";
import { Field, Form, Formik } from "formik";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const createResourceSchema = z.object({
	name: z.string().min(1, "Название обязательно").max(255),
	code: z.string().min(1, "Код обязателен").max(50),
	category: z.string().max(100).optional(),
	description: z.string().max(1000).optional(),
	quantity_total: z.coerce
		.number()
		.int()
		.min(1, "Количество должно быть не меньше 1"),
	quantity_active: z.coerce
		.number()
		.int()
		.min(0, "Активное количество должно быть не меньше 0"),
});

type CreateResourceFormValues = z.infer<typeof createResourceSchema>;

type ResourceSortKey = "name" | "code" | "category" | "availability";

export function ResourceList() {
	const [resources, setResources] = useState<Resource[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortKey, setSortKey] = useState<ResourceSortKey | null>(null);
	const [sortDir, setSortDir] = useState<SortDirection>("asc");

	const loadResources = useCallback(async () => {
		const companyId = getStoredCompanyId();
		if (!companyId) {
			setResources([]);
			setError(NO_COMPANY_SELECTED_MESSAGE);
			setLoading(false);
			return;
		}
		await apiFetch<{ resources: Resource[] }>(
			`/companies/${companyId}/resources`,
		)
			.then((data) => {
				setResources(data.resources);
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
		void loadResources();
	}, [loadResources]);

	const visibleResources = useMemo(() => {
		const searched = filterBySearch(resources, searchQuery, (r) =>
			[
				r.name,
				r.code,
				r.category ?? "",
				String(r.quantity_active),
				String(r.quantity_total),
			].join(" "),
		);
		return sortByColumn(searched, sortKey, sortDir, (r, key) => {
			switch (key) {
				case "name":
					return r.name;
				case "code":
					return r.code;
				case "category":
					return r.category ?? "";
				case "availability":
					return r.quantity_active / Math.max(r.quantity_total, 1);
				default:
					return "";
			}
		});
	}, [resources, searchQuery, sortKey, sortDir]);

	function handleSort(columnKey: string) {
		const next = toggleSortColumn(sortKey, sortDir, columnKey as ResourceSortKey);
		setSortKey(next.sortKey);
		setSortDir(next.sortDir);
	}

	async function handleCreateResource(values: CreateResourceFormValues) {
		const companyId = getStoredCompanyId();
		if (!companyId) {
			throw new Error(NO_COMPANY_SELECTED_MESSAGE);
		}

		await apiFetch(`/companies/${companyId}/resources`, {
			method: "POST",
			body: JSON.stringify({
				name: values.name.trim(),
				code: values.code.trim(),
				category: values.category?.trim() || undefined,
				description: values.description?.trim() || undefined,
				quantity_total: values.quantity_total,
				quantity_active: values.quantity_active,
			}),
		});
		await loadResources();
		toast.success("Ресурс создан.");
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
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-4">
						<CardTitle>Ресурсы</CardTitle>
						<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
							<DialogTrigger asChild>
								<Button>Добавить ресурс</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-2xl">
								<DialogHeader>
									<DialogTitle>Создать ресурс</DialogTitle>
									<DialogDescription>
										Администраторы компании могут добавлять ресурсы для
										бронирования.
									</DialogDescription>
								</DialogHeader>
								<Formik<CreateResourceFormValues>
									initialValues={{
										name: "",
										code: "",
										category: "",
										description: "",
										quantity_total: 1,
										quantity_active: 1,
									}}
									validate={(values) =>
										zodToFormikErrors(createResourceSchema, values)
									}
									onSubmit={async (values, helpers) => {
										try {
											await handleCreateResource(values);
											helpers.resetForm();
											setCreateDialogOpen(false);
										} catch (err) {
											toast.error(
												err instanceof Error
													? err.message
													: "Не удалось создать ресурс",
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
												<Label htmlFor="category">Категория</Label>
												<Field as={Input} id="category" name="category" />
												{touched.category && errors.category ? (
													<p className="text-sm text-destructive">
														{errors.category}
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
											<div className="space-y-2">
												<Label htmlFor="quantity_total">Общее количество</Label>
												<Field
													as={Input}
													id="quantity_total"
													name="quantity_total"
													type="number"
												/>
												{touched.quantity_total && errors.quantity_total ? (
													<p className="text-sm text-destructive">
														{errors.quantity_total}
													</p>
												) : null}
											</div>
											<div className="space-y-2">
												<Label htmlFor="quantity_active">
													Активное количество
												</Label>
												<Field
													as={Input}
													id="quantity_active"
													name="quantity_active"
													type="number"
												/>
												{touched.quantity_active && errors.quantity_active ? (
													<p className="text-sm text-destructive">
														{errors.quantity_active}
													</p>
												) : null}
											</div>
											<div className="md:col-span-2">
												<Button type="submit" disabled={isSubmitting}>
													{isSubmitting
														? "Создание ресурса..."
														: "Добавить ресурс"}
												</Button>
											</div>
										</Form>
									)}
								</Formik>
							</DialogContent>
						</Dialog>
					</div>
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
									label="Название"
									columnKey="name"
									activeKey={sortKey}
									direction={sortDir}
									onSort={handleSort}
								/>
								<SortableTableHead
									label="Код"
									columnKey="code"
									activeKey={sortKey}
									direction={sortDir}
									onSort={handleSort}
								/>
								<SortableTableHead
									label="Категория"
									columnKey="category"
									activeKey={sortKey}
									direction={sortDir}
									onSort={handleSort}
								/>
								<SortableTableHead
									label="Доступность"
									columnKey="availability"
									activeKey={sortKey}
									direction={sortDir}
									onSort={handleSort}
								/>
								<TableHead className="w-[1%]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{visibleResources.map((r) => (
								<TableRow key={r.id}>
									<TableCell className="font-medium">{r.name}</TableCell>
									<TableCell>{r.code}</TableCell>
									<TableCell>{r.category ?? "—"}</TableCell>
									<TableCell>
										<Badge
											variant={r.quantity_active > 0 ? "default" : "secondary"}
										>
											{r.quantity_active}/{r.quantity_total}
										</Badge>
									</TableCell>
									<TableCell>
										<Link
											href={`/resources/${r.id}`}
											className="text-primary hover:underline"
										>
											Открыть
										</Link>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					{resources.length > 0 && visibleResources.length === 0 ? (
						<p className="py-4 text-center text-muted-foreground">
							Ничего не найдено.
						</p>
					) : null}
					{resources.length === 0 && (
						<p className="py-4 text-center text-muted-foreground">
							Ресурсы не найдены.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
