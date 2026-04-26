"use client";

import { createBrowserClient } from "@shared/lib/supabase";
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
import { useFormik } from "formik";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
	email: z.string().email("Некорректный email"),
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
				setError(
					e instanceof Error
						? e.message
						: "Не удалось отправить письмо для сброса пароля",
				);
			}
		},
	});

	if (sent) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Проверьте почту</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4">
							Если аккаунт с таким email существует, мы отправили ссылку для
							сброса пароля.
						</p>
						<Link href="/login">
							<Button variant="outline">Назад ко входу</Button>
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
					<CardTitle>Сброс пароля</CardTitle>
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
						{error && <p className="text-sm text-destructive">{error}</p>}
						<div className="flex gap-2">
							<Button type="submit" disabled={formik.isSubmitting}>
								Отправить ссылку
							</Button>
							<Link href="/login">
								<Button type="button" variant="outline">
									Отмена
								</Button>
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
