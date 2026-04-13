import Link from "next/link";
import { SupportRentalQueue } from "@/src/widgets/support-rental-queue/support-rental-queue";
import { LogoutButton } from "@/src/features/auth/logout";

export default function SupportRentalsPage() {
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
					<h1 className="text-2xl font-bold">Support: Rental requests</h1>
				</div>
				<LogoutButton />
			</div>
			<SupportRentalQueue />
		</div>
	);
}
