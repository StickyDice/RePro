import Link from "next/link";
import { LogoutButton } from "@/src/features/auth/logout";
import { ResourceList } from "@/src/widgets/resource-list/resource-list";

export default function AdminResourcesPage() {
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
					<h1 className="text-2xl font-bold">Управление ресурсами</h1>
				</div>
				<LogoutButton />
			</div>
			<ResourceList />
		</div>
	);
}
