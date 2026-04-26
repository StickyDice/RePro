import Link from "next/link";
import { LogoutButton } from "@/src/features/auth/logout";
import { RentalQueue } from "@/src/widgets/rental-queue/rental-queue";

export default function MyRentalsPage() {
	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link
						href="/dashboard"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						← Панель управления
					</Link>
					<h1 className="text-2xl font-bold">Мои бронирования</h1>
				</div>
				<LogoutButton />
			</div>
			<RentalQueue />
		</div>
	);
}
