import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountUnderReviewPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Аккаунт на проверке</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground">
						Ваш аккаунт ожидает проверки. Наша команда скоро его рассмотрит.
						После одобрения вы получите письмо.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
