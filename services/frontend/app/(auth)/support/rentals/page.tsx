import Link from "next/link";
import { LogoutButton } from "@/src/features/auth/logout";
import { SupportRentalQueue } from "@/src/widgets/support-rental-queue/support-rental-queue";

export default function SupportRentalsPage() {
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
					<h1 className="text-2xl font-bold">
						Поддержка: заявки на бронирование
					</h1>
				</div>
				<LogoutButton />
			</div>
			<SupportRentalQueue />
		</div>
	);
}
