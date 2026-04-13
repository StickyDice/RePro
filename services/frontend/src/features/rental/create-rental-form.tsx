"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import { z } from "zod";
import { zodToFormikErrors } from "@shared/lib/zod-formik";
import { format, addMonths } from "date-fns";
import { apiFetch } from "@shared/api/client";
import {
	Button,
	Input,
	Label,
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@shared/ui";

const createRentalSchema = z
	.object({
		requested_start_at: z.string().min(1, "Start date is required"),
		requested_end_at: z.string().min(1, "End date is required"),
		comment: z.string().max(2000).optional(),
	})
	.refine(
		(data) =>
			new Date(data.requested_start_at) < new Date(data.requested_end_at),
		{ message: "End date must be after start date", path: ["requested_end_at"] },
	);

type CreateRentalFormValues = z.infer<typeof createRentalSchema>;

interface CreateRentalFormProps {
	resourceId: string;
}

export function CreateRentalForm({ resourceId }: CreateRentalFormProps) {
	const router = useRouter()
	const [error, setError] = useState<string | null>(null)

	const today = format(new Date(), "yyyy-MM-dd");
	const defaultEnd = format(addMonths(new Date(), 1), "yyyy-MM-dd");

	async function handleSubmit(values: CreateRentalFormValues) {
		setError(null);
		const companyId =
			typeof window !== "undefined" ? localStorage.getItem("companyId") : null;
		if (!companyId) {
			setError("Company context required");
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
			setError(err instanceof Error ? err.message : "Failed to create rental");
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Request rental</CardTitle>
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
								<Label htmlFor="requested_start_at">Start date</Label>
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
								<Label htmlFor="requested_end_at">End date</Label>
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
								<Label htmlFor="comment">Comment (optional)</Label>
								<Field
									as="textarea"
									id="comment"
									name="comment"
									className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Submitting..." : "Submit request"}
							</Button>
						</Form>
					)}
				</Formik>
			</CardContent>
		</Card>
	);
}
