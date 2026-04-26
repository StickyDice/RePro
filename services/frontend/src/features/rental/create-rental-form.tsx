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
} from "@shared/ui";
import { addMonths, format } from "date-fns";
import { Field, Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

const createRentalSchema = z
	.object({
		requested_start_at: z.string().min(1, "Дата начала обязательна"),
		requested_end_at: z.string().min(1, "Дата окончания обязательна"),
		comment: z.string().max(2000).optional(),
	})
	.refine(
		(data) =>
			new Date(data.requested_start_at) < new Date(data.requested_end_at),
		{
			message: "Дата окончания должна быть позже даты начала",
			path: ["requested_end_at"],
		},
	);

type CreateRentalFormValues = z.infer<typeof createRentalSchema>;

interface CreateRentalFormProps {
	resourceId: string;
}

export function CreateRentalForm({ resourceId }: CreateRentalFormProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	const today = format(new Date(), "yyyy-MM-dd");
	const defaultEnd = format(addMonths(new Date(), 1), "yyyy-MM-dd");

	async function handleSubmit(values: CreateRentalFormValues) {
		setError(null);
		const companyId =
			typeof window !== "undefined" ? localStorage.getItem("companyId") : null;
		if (!companyId) {
			setError("Необходимо выбрать компанию");
			return;
		}
		try {
			await apiFetch(`/companies/${companyId}/rentals`, {
				method: "POST",
				body: JSON.stringify({
					resource_id: resourceId,
					requested_start_at: values.requested_start_at,
					requested_end_at: values.requested_end_at,
					comment: values.comment || undefined,
				}),
			});
			router.push("/my-rentals");
			router.refresh();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Не удалось создать бронирование",
			);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Запросить бронирование</CardTitle>
			</CardHeader>
			<CardContent>
				<Formik<CreateRentalFormValues>
					initialValues={{
						requested_start_at: today,
						requested_end_at: defaultEnd,
						comment: "",
					}}
					validate={(values) => zodToFormikErrors(createRentalSchema, values)}
					onSubmit={handleSubmit}
				>
					{({ errors, touched, isSubmitting }) => (
						<Form className="space-y-4">
							{error && (
								<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
									{error}
								</div>
							)}
							<div className="space-y-2">
								<Label htmlFor="requested_start_at">Дата начала</Label>
								<Field
									as={Input}
									id="requested_start_at"
									name="requested_start_at"
									type="date"
								/>
								{touched.requested_start_at && errors.requested_start_at && (
									<p className="text-sm text-destructive">
										{errors.requested_start_at}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="requested_end_at">Дата окончания</Label>
								<Field
									as={Input}
									id="requested_end_at"
									name="requested_end_at"
									type="date"
								/>
								{touched.requested_end_at && errors.requested_end_at && (
									<p className="text-sm text-destructive">
										{errors.requested_end_at}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="comment">Комментарий (необязательно)</Label>
								<Field
									as="textarea"
									id="comment"
									name="comment"
									className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Отправка..." : "Отправить заявку"}
							</Button>
						</Form>
					)}
				</Formik>
			</CardContent>
		</Card>
	);
}
