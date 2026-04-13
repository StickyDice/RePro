import Link from "next/link";
import { RentalQueue } from "@/src/widgets/rental-queue/rental-queue";
import { LogoutButton } from "@/src/features/auth/logout";

export default function CalendarPage() {
	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link
						href="/dashboard"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						← Dashboard
					</Link>
					<h1 className="text-2xl font-bold">My rentals calendar</h1>
				</div>
				<LogoutButton />
			</div>
			<p className="mb-4 text-muted-foreground">
				View your rental requests in a list. For a full calendar view, check
				your Google Calendar after your rentals are approved.
			</p>
			<RentalQueue />
		</div>
	);
}
