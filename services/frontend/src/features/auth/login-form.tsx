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
import { Field, Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

const loginSchema = z.object({
	email: z.string().email("Некорректный email"),
	password: z.string().min(1, "Пароль обязателен"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function translateLoginError(message: string): string {
	if (message === "Invalid login credentials") {
		return "Неверный email или пароль";
	}
	return message;
}

export function LoginForm() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(values: LoginFormValues) {
		setError(null);
		const supabase = createBrowserClient();
		const { error: signInError } = await supabase.auth.signInWithPassword({
			email: values.email,
			password: values.password,
		});
		if (signInError) {
			setError(translateLoginError(signInError.message));
			return;
		}
		router.push("/select-company");
		router.refresh();
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Вход</CardTitle>
			</CardHeader>
			<CardContent>
				<Formik<LoginFormValues>
					initialValues={{ email: "", password: "" }}
					validate={(values) => zodToFormikErrors(loginSchema, values)}
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
								<Label htmlFor="email">Email</Label>
								<Field
									as={Input}
									id="email"
									name="email"
									type="email"
									placeholder="you@example.com"
									autoComplete="email"
								/>
								{touched.email && errors.email && (
									<p className="text-sm text-destructive">{errors.email}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Пароль</Label>
								<Field
									as={Input}
									id="password"
									name="password"
									type="password"
									autoComplete="current-password"
								/>
								{touched.password && errors.password && (
									<p className="text-sm text-destructive">{errors.password}</p>
								)}
							</div>
							<Button type="submit" className="w-full" disabled={isSubmitting}>
								{isSubmitting ? "Вход..." : "Войти"}
							</Button>
						</Form>
					)}
				</Formik>
			</CardContent>
		</Card>
	);
}
