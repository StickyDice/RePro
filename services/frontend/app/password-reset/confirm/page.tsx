"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@shared/lib/supabase";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@shared/ui";

export default function PasswordResetConfirmPage() {
	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

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
						<CardTitle>Link expired or invalid</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4">
							The password reset link may have expired. Please request a new one.
						</p>
						<Link href="/password-reset/request">
							<Button>Request new link</Button>
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
					<CardTitle>Set new password</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground mb-4">
						You have been redirected here after clicking the password reset link.
						You can now set your new password in the Supabase dashboard, or if
						you have a custom password update flow, it would appear here.
					</p>
					<p className="text-muted-foreground mb-4 text-sm">
						For this MVP, Supabase handles the password update via the link. You
						should have received an email - follow the link there to complete the
						reset. After resetting, your account will be under review.
					</p>
					<Link href="/login">
						<Button>Go to login</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
