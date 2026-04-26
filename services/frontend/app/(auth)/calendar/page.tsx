import { RentalQueue } from "@/src/widgets/rental-queue/rental-queue";

export default function CalendarPage() {
	return (
		<div className="container py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Календарь моих бронирований</h1>
			</div>
			<p className="mb-4 text-muted-foreground">
				Просматривайте заявки на бронирование списком. Полный календарный вид
				доступен в Google Calendar после одобрения бронирований.
			</p>
			<RentalQueue />
		</div>
	);
}
