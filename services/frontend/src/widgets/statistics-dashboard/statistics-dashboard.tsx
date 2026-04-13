"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@shared/ui";

export function StatisticsDashboard() {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Resources</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground mb-4">
						Browse and book available resources.
					</p>
					<Button asChild>
						<Link href="/resources">View resources</Link>
					</Button>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>My rentals</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground mb-4">
						View your rental requests and their status.
					</p>
					<Button variant="outline" asChild>
						<Link href="/my-rentals">View my rentals</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
