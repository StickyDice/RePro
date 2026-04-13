"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import { z } from "zod";
import { zodToFormikErrors } from "@shared/lib/zod-formik";
import { apiFetch } from "@shared/api/client";
import {
	Button,
	Input,
	Label,
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@shared/ui";

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
	{ value: "basic", label: "Basic" },
	{ value: "pro", label: "Pro" },
	{ value: "enterprise", label: "Enterprise" },
] as const;

export function CompanyApplicationForm() {
	const router = useRouter();
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(values: ApplicationFormValues) {
		setError(null);
		try {
			await apiFetch("/company-applications", {
				method: "POST",
				body: JSON.stringify(values),
			});
			setSuccess(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Submission failed");
		}
	}

	if (success) {
		return (
			<Card className="w-full max-w-2xl">
				<CardHeader>
					<CardTitle>Application submitted</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						Thank you. We will review your application and contact you soon.
					</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => router.push("/")}
					>
						Back to home
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-2xl">
			<CardHeader>
				<CardTitle>Company application</CardTitle>
			</CardHeader>
			<CardContent>
				<Formik<ApplicationFormValues>
					initialValues={{
						company_name: "",
						inn: "",
						contact_email: "",
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
									<Label htmlFor="company_name">Company name</Label>
									<Field
										as={Input}
										id="company_name"
										name="company_name"
										placeholder="Acme Inc"
									/>
									{touched.company_name && errors.company_name && (
										<p className="text-sm text-destructive">
											{errors.company_name}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="inn">INN</Label>
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
									<Label htmlFor="contact_first_name">First name</Label>
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
									<Label htmlFor="contact_last_name">Last name</Label>
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
								<Label htmlFor="contact_patronymic">Patronymic (optional)</Label>
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
									/>
									{touched.contact_email && errors.contact_email && (
										<p className="text-sm text-destructive">
											{errors.contact_email}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="contact_phone">Phone</Label>
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
								<Label htmlFor="selected_plan">Plan</Label>
								<Select
									value={values.selected_plan}
									onValueChange={(v) => setFieldValue("selected_plan", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select plan" />
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
								<Label htmlFor="payment_method">Payment method</Label>
								<Field
									as={Input}
									id="payment_method"
									name="payment_method"
									placeholder="e.g. Card, Invoice"
								/>
								{touched.payment_method && errors.payment_method && (
									<p className="text-sm text-destructive">
										{errors.payment_method}
									</p>
								)}
							</div>
							<Button type="submit">Submit application</Button>
						</Form>
					)}
				</Formik>
			</CardContent>
		</Card>
	);
}
