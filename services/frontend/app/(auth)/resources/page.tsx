import Link from "next/link";
import { ResourceList } from "@/src/widgets/resource-list/resource-list";
import { LogoutButton } from "@/src/features/auth/logout";

export default function ResourcesPage() {
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
					<h1 className="text-2xl font-bold">Resources</h1>
				</div>
				<LogoutButton />
			</div>
			<ResourceList />
		</div>
	);
}
