"use client";

import { apiFetch } from "@shared/api/client";
import { zodToFormikErrors } from "@shared/lib/zod-formik";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@shared/ui";
import { Field, Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/src/features/auth/auth-provider";

const applicationSchema = z.object({
	company_name: z.string().min(1).max(255),
	inn: z.string().min(10).max(12),
	contact_email: z.string().email(),
	contact_phone: z.string().min(1).max(50),
	contact_first_name: z.string().min(1).max(100),
	contact_last_name: z.string().min(1).max(100),
	contact_patronymic: z.string().max(100).optional(),
	selected_plan: z.enum(["basic", "pro", "enterprise"]),
	payment_method: z.string().min(1).max(50),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const PLAN_OPTIONS = [
	{ value: "basic", label: "Базовый" },
	{ value: "pro", label: "Профессиональный" },
	{ value: "enterprise", label: "Корпоративный" },
] as const;

export function CompanyApplicationForm() {
	const router = useRouter();
	const { user, loading: authLoading } = useAuth();
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const authenticatedEmail = user?.email?.trim().toLowerCase() ?? "";

	async function handleSubmit(values: ApplicationFormValues) {
		setError(null);
		try {
			await apiFetch("/company-applications", {
				method: "POST",
				body: JSON.stringify(values),
			});
			setSuccess(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Не удалось отправить заявку",
			);
		}
	}

	if (success) {
		return (
			<Card className="w-full max-w-2xl">
				<CardHeader>
					<CardTitle>Заявка отправлена</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						Спасибо. Мы рассмотрим заявку и скоро с вами свяжемся.
					</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => router.push("/")}
					>
						На главную
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-2xl">
			<CardHeader>
				<CardTitle>Заявка на подключение компании</CardTitle>
			</CardHeader>
			<CardContent>
				<Formik<ApplicationFormValues>
					enableReinitialize
					initialValues={{
						company_name: "",
						inn: "",
						contact_email: authenticatedEmail,
						contact_phone: "",
						contact_first_name: "",
						contact_last_name: "",
						contact_patronymic: "",
						selected_plan: "basic",
						payment_method: "",
					}}
					validate={(values) => zodToFormikErrors(applicationSchema, values)}
					onSubmit={handleSubmit}
				>
					{({ errors, touched, setFieldValue, values }) => (
						<Form className="space-y-4">
							{error && (
								<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
									{error}
								</div>
							)}
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="company_name">Название компании</Label>
									<Field
										as={Input}
										id="company_name"
										name="company_name"
										placeholder="ООО Ромашка"
									/>
									{touched.company_name && errors.company_name && (
										<p className="text-sm text-destructive">
											{errors.company_name}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="inn">ИНН</Label>
									<Field
										as={Input}
										id="inn"
										name="inn"
										placeholder="1234567890"
									/>
									{touched.inn && errors.inn && (
										<p className="text-sm text-destructive">{errors.inn}</p>
									)}
								</div>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="contact_first_name">Имя</Label>
									<Field
										as={Input}
										id="contact_first_name"
										name="contact_first_name"
									/>
									{touched.contact_first_name && errors.contact_first_name && (
										<p className="text-sm text-destructive">
											{errors.contact_first_name}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="contact_last_name">Фамилия</Label>
									<Field
										as={Input}
										id="contact_last_name"
										name="contact_last_name"
									/>
									{touched.contact_last_name && errors.contact_last_name && (
										<p className="text-sm text-destructive">
											{errors.contact_last_name}
										</p>
									)}
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="contact_patronymic">
									Отчество (необязательно)
								</Label>
								<Field
									as={Input}
									id="contact_patronymic"
									name="contact_patronymic"
								/>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="contact_email">Email</Label>
									<Field
										as={Input}
										id="contact_email"
										name="contact_email"
										type="email"
										disabled={Boolean(authenticatedEmail) || authLoading}
									/>
									{authenticatedEmail ? (
										<p className="text-sm text-muted-foreground">
											Пока вы вошли в систему, заявка привязывается к email
											вашего аккаунта.
										</p>
									) : null}
									{touched.contact_email && errors.contact_email && (
										<p className="text-sm text-destructive">
											{errors.contact_email}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="contact_phone">Телефон</Label>
									<Field
										as={Input}
										id="contact_phone"
										name="contact_phone"
										type="tel"
									/>
									{touched.contact_phone && errors.contact_phone && (
										<p className="text-sm text-destructive">
											{errors.contact_phone}
										</p>
									)}
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="selected_plan">Тариф</Label>
								<Select
									value={values.selected_plan}
									onValueChange={(v) => setFieldValue("selected_plan", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Выберите тариф" />
									</SelectTrigger>
									<SelectContent>
										{PLAN_OPTIONS.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{touched.selected_plan && errors.selected_plan && (
									<p className="text-sm text-destructive">
										{errors.selected_plan}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="payment_method">Способ оплаты</Label>
								<Field
									as={Input}
									id="payment_method"
									name="payment_method"
									placeholder="Например: карта, счёт"
								/>
								{touched.payment_method && errors.payment_method && (
									<p className="text-sm text-destructive">
										{errors.payment_method}
									</p>
								)}
							</div>
							<Button type="submit">Отправить заявку</Button>
						</Form>
					)}
				</Formik>
			</CardContent>
		</Card>
	);
}
