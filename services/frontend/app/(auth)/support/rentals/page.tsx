import { SupportRentalQueue } from "@/src/widgets/support-rental-queue/support-rental-queue";

export default function SupportRentalsPage() {
	return (
		<div className="container py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">
					Поддержка: заявки на бронирование
				</h1>
			</div>
			<SupportRentalQueue />
		</div>
	);
}
