"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@shared/ui";
import Link from "next/link";

export function StatisticsDashboard() {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Ресурсы</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground mb-4">
						Просматривайте и бронируйте доступные ресурсы.
					</p>
					<Button asChild>
						<Link href="/resources">Открыть ресурсы</Link>
					</Button>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Мои бронирования</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground mb-4">
						Проверяйте свои заявки на бронирование и их статус.
					</p>
					<Button variant="outline" asChild>
						<Link href="/my-rentals">Открыть мои бронирования</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
