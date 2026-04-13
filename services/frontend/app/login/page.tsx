import { LoginForm } from "@/src/features/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<LoginForm />
			<div className="mt-4 flex flex-col items-center gap-2">
				<Link
					href="/password-reset/request"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					Forgot password?
				</Link>
				<Link
					href="/"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Back to home
				</Link>
			</div>
		</div>
	);
}
