"use client";

import { createBrowserClient } from "@shared/lib/supabase";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@shared/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PasswordResetConfirmPage() {
	const [status, setStatus] = useState<"loading" | "success" | "error">(
		"loading",
	);

	useEffect(() => {
		const supabase = createBrowserClient();
		supabase.auth
			.getSession()
			.then(({ data: { session } }) => {
				if (session) {
					setStatus("success");
				} else {
					setStatus("error");
				}
			})
			.catch(() => setStatus("error"));
	}, []);

	if (status === "loading") {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Ссылка недействительна или устарела</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4">
							Ссылка для сброса пароля могла устареть. Запросите новую.
						</p>
						<Link href="/password-reset/request">
							<Button>Запросить новую ссылку</Button>
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
					<CardTitle>Установите новый пароль</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground mb-4">
						Вы были перенаправлены сюда после перехода по ссылке для сброса
						пароля. Теперь можно установить новый пароль.
					</p>
					<p className="text-muted-foreground mb-4 text-sm">
						В текущей версии обновление пароля обрабатывает Supabase через
						письмо. Завершите сброс по ссылке из письма. После смены пароля
						аккаунт будет ожидать проверки.
					</p>
					<Link href="/login">
						<Button>Перейти ко входу</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
