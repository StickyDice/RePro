import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/src/features/auth/logout";

export default function AccountUnderReviewPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Account under review</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground">
						Your account is pending verification. Our team will review it shortly.
						You will receive an email when your account is approved.
					</p>
					<LogoutButton />
				</CardContent>
			</Card>
		</div>
	);
}
