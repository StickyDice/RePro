import Link from "next/link";
import { StatisticsDashboard } from "@/src/widgets/statistics-dashboard/statistics-dashboard";
import { LogoutButton } from "@/src/features/auth/logout";
import { Button } from "@shared/ui";

export default function DashboardPage() {
	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<LogoutButton />
			</div>
			<p className="mb-6 text-muted-foreground">
				Welcome! Choose an action below.
			</p>
			<StatisticsDashboard />
			<div className="mt-6 flex flex-wrap gap-2">
				<Button variant="outline" asChild>
					<Link href="/support/rentals">Support: Rental queue</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/admin/users">Manage users</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/admin/roles">Manage roles</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/admin/resources">Manage resources</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/platform/company-applications">
						Platform admin: Applications
					</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/statistics">Statistics</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/calendar">My rentals calendar</Link>
				</Button>
			</div>
		</div>
	);
}
