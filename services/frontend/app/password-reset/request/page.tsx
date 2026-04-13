"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormik } from "formik";
import { z } from "zod";
import { zodToFormikErrors } from "@shared/lib/zod-formik";
import { createBrowserClient } from "@shared/lib/supabase";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from "@shared/ui";

const schema = z.object({
	email: z.string().email("Invalid email"),
});

export default function PasswordResetRequestPage() {
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const formik = useFormik({
		initialValues: { email: "" },
		validate: (values) => zodToFormikErrors(schema, values),
		onSubmit: async (values) => {
			setError(null);
			try {
				const supabase = createBrowserClient();
				const { error: err } = await supabase.auth.resetPasswordForEmail(
					values.email,
					{
						redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/password-reset/confirm`,
					},
				);
				if (err) throw err;
				setSent(true);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to send reset email");
			}
		},
	});

	if (sent) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Check your email</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4">
							If an account exists with that email, we&apos;ve sent a password
							reset link.
						</p>
						<Link href="/login">
							<Button variant="outline">Back to login</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Reset password</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={formik.handleSubmit} className="space-y-4">
						<div>
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								{...formik.getFieldProps("email")}
								className="mt-1"
							/>
							{formik.touched.email && formik.errors.email && (
								<p className="mt-1 text-sm text-destructive">
									{formik.errors.email}
								</p>
							)}
						</div>
						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}
						<div className="flex gap-2">
							<Button type="submit" disabled={formik.isSubmitting}>
								Send reset link
							</Button>
							<Link href="/login">
								<Button type="button" variant="outline">
									Cancel
								</Button>
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
