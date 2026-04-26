"use client";

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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@shared/ui";
import { Field, Form, Formik } from "formik";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { LogoutButton } from "@/src/features/auth/logout";

interface Member {
	id: string;
	user_id: string;
	role_id: string;
	status: string;
	user: {
		email: string | null;
		first_name: string | null;
		last_name: string | null;
		phone_number: string | null;
	};
	role: { name: string; code: string };
}

interface RoleOption {
	id: string;
	name: string;
	code: string;
}

const membershipStatusLabel: Record<string, string> = {
	active: "Активен",
	invited: "Приглашён",
	blocked: "Заблокирован",
	pending: "Ожидает",
};

const addMemberSchema = z.object({
	email: z.string().email("Укажите корректный email"),
	phone: z.string().max(50).optional(),
	first_name: z.string().max(100).optional(),
	last_name: z.string().max(100).optional(),
	patronymic: z.string().max(100).optional(),
	role_id: z.string().uuid("Выберите роль"),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

export default function AdminUsersPage() {
	const [members, setMembers] = useState<Member[]>([]);
	const [roles, setRoles] = useState<RoleOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const loadData = useCallback(async () => {
		const companyId = getStoredCompanyId();
		if (!companyId) {
			setMembers([]);
			setRoles([]);
			setError(NO_COMPANY_SELECTED_MESSAGE);
			setLoading(false);
			return;
		}
		await Promise.all([
			apiFetch<{ members: Member[] }>(`/companies/${companyId}/members`),
			apiFetch<{ roles: RoleOption[] }>(`/companies/${companyId}/roles`),
		])
			.then(([membersData, rolesData]) => {
				setMembers(membersData.members ?? []);
				setRoles(rolesData.roles ?? []);
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
		void loadData();
	}, [loadData]);

	async function handleAddMember(values: AddMemberFormValues) {
		const companyId = getStoredCompanyId();
		if (!companyId) {
			throw new Error(NO_COMPANY_SELECTED_MESSAGE);
		}

		await apiFetch(`/companies/${companyId}/members`, {
			method: "POST",
			body: JSON.stringify({
				email: values.email.trim(),
				phone: values.phone?.trim() || undefined,
				first_name: values.first_name?.trim() || undefined,
				last_name: values.last_name?.trim() || undefined,
				patronymic: values.patronymic?.trim() || undefined,
				role_id: values.role_id,
			}),
		});
		await loadData();
		toast.success("Сотрудник добавлен.");
	}

	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link
						href="/dashboard"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						← Панель управления
					</Link>
					<h1 className="text-2xl font-bold">Управление пользователями</h1>
				</div>
				<div className="flex items-center gap-2">
					<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
						<DialogTrigger asChild>
							<Button>Добавить сотрудника</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-2xl">
							<DialogHeader>
								<DialogTitle>Добавить сотрудника</DialogTitle>
								<DialogDescription>
									Добавьте существующего пользователя или пригласите нового
									сотрудника в компанию.
								</DialogDescription>
							</DialogHeader>
							<Formik<AddMemberFormValues>
								initialValues={{
									email: "",
									phone: "",
									first_name: "",
									last_name: "",
									patronymic: "",
									role_id: "",
								}}
								validate={(values) =>
									zodToFormikErrors(addMemberSchema, values)
								}
								onSubmit={async (values, helpers) => {
									try {
										await handleAddMember(values);
										helpers.resetForm();
										setCreateDialogOpen(false);
									} catch (err) {
										toast.error(
											err instanceof Error
												? err.message
												: "Не удалось добавить сотрудника",
										);
									} finally {
										helpers.setSubmitting(false);
									}
								}}
							>
								{({ errors, touched, isSubmitting, values, setFieldValue }) => (
									<Form className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="email">Email</Label>
											<Field as={Input} id="email" name="email" type="email" />
											{touched.email && errors.email ? (
												<p className="text-sm text-destructive">
													{errors.email}
												</p>
											) : null}
										</div>
										<div className="space-y-2">
											<Label htmlFor="phone">Телефон</Label>
											<Field as={Input} id="phone" name="phone" />
											{touched.phone && errors.phone ? (
												<p className="text-sm text-destructive">
													{errors.phone}
												</p>
											) : null}
										</div>
										<div className="space-y-2">
											<Label htmlFor="first_name">Имя</Label>
											<Field as={Input} id="first_name" name="first_name" />
											{touched.first_name && errors.first_name ? (
												<p className="text-sm text-destructive">
													{errors.first_name}
												</p>
											) : null}
										</div>
										<div className="space-y-2">
											<Label htmlFor="last_name">Фамилия</Label>
											<Field as={Input} id="last_name" name="last_name" />
											{touched.last_name && errors.last_name ? (
												<p className="text-sm text-destructive">
													{errors.last_name}
												</p>
											) : null}
										</div>
										<div className="space-y-2">
											<Label htmlFor="patronymic">Отчество</Label>
											<Field as={Input} id="patronymic" name="patronymic" />
											{touched.patronymic && errors.patronymic ? (
												<p className="text-sm text-destructive">
													{errors.patronymic}
												</p>
											) : null}
										</div>
										<div className="space-y-2">
											<Label htmlFor="role_id">Роль</Label>
											<Select
												value={values.role_id}
												onValueChange={(value) =>
													setFieldValue("role_id", value)
												}
											>
												<SelectTrigger id="role_id">
													<SelectValue placeholder="Выберите роль" />
												</SelectTrigger>
												<SelectContent>
													{roles.map((role) => (
														<SelectItem key={role.id} value={role.id}>
															{role.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{touched.role_id && errors.role_id ? (
												<p className="text-sm text-destructive">
													{errors.role_id}
												</p>
											) : null}
										</div>
										<div className="md:col-span-2">
											<Button
												type="submit"
												disabled={isSubmitting || roles.length === 0}
											>
												{isSubmitting
													? "Добавление сотрудника..."
													: "Добавить сотрудника"}
											</Button>
										</div>
									</Form>
								)}
							</Formik>
						</DialogContent>
					</Dialog>
					<LogoutButton />
				</div>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Сотрудники компании</CardTitle>
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
									<TableHead>Имя</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Роль</TableHead>
									<TableHead>Статус</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{members.map((m) => (
									<TableRow key={m.id}>
										<TableCell>
											{m.user?.first_name} {m.user?.last_name}
										</TableCell>
										<TableCell>{m.user?.email ?? "-"}</TableCell>
										<TableCell>{m.role?.name ?? m.role?.code}</TableCell>
										<TableCell>
											<Badge variant="outline">
												{membershipStatusLabel[m.status] ?? m.status}
											</Badge>
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
