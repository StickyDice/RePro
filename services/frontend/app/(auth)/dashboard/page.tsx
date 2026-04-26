import { StatisticsDashboard } from "@/src/widgets/statistics-dashboard/statistics-dashboard";

export default function DashboardPage() {
	return (
		<div className="container py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Панель управления</h1>
			</div>
			<p className="mb-6 text-muted-foreground">
				Добро пожаловать! Разделы открываются из меню слева.
			</p>
			<StatisticsDashboard />
		</div>
	);
}
