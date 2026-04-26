import Link from "next/link";
import { LogoutButton } from "@/src/features/auth/logout";
import { ProfileSettings } from "@/src/features/profile/profile-settings";

export default function ProfilePage() {
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
					<div>
						<h1 className="text-2xl font-bold">Настройки профиля</h1>
						<p className="text-sm text-muted-foreground">
							Управляйте паролем и выбранной компанией.
						</p>
					</div>
				</div>
				<LogoutButton />
			</div>
			<ProfileSettings />
		</div>
	);
}
