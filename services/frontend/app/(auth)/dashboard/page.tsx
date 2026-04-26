import { Button } from "@shared/ui";
import Link from "next/link";
import { LogoutButton } from "@/src/features/auth/logout";
import { StatisticsDashboard } from "@/src/widgets/statistics-dashboard/statistics-dashboard";

export default function DashboardPage() {
	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Панель управления</h1>
				<LogoutButton />
			</div>
			<p className="mb-6 text-muted-foreground">
				Добро пожаловать! Выберите действие ниже.
			</p>
			<StatisticsDashboard />
			<div className="mt-6 flex flex-wrap gap-2">
				<Button variant="outline" asChild>
					<Link href="/profile">Настройки профиля</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/support/rentals">Поддержка: очередь заявок</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/admin/users">Управление пользователями</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/admin/roles">Управление ролями</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/admin/resources">Управление ресурсами</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/platform/company-applications">
						Администратор платформы: заявки
					</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/statistics">Статистика</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/calendar">Календарь моих бронирований</Link>
				</Button>
				{process.env.NEXT_PUBLIC_SUPABASE_URL ? (
					<Button variant="outline" asChild>
						<a
							href={process.env.NEXT_PUBLIC_SUPABASE_URL}
							target="_blank"
							rel="noopener noreferrer"
						>
							Supabase Studio (база данных и авторизация)
						</a>
					</Button>
				) : null}
			</div>
		</div>
	);
}
