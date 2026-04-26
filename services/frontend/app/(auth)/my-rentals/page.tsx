import { RentalQueue } from "@/src/widgets/rental-queue/rental-queue";

export default function MyRentalsPage() {
	return (
		<div className="container py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Мои бронирования</h1>
			</div>
			<RentalQueue />
		</div>
	);
}
