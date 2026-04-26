import { ProfileSettings } from "@/src/features/profile/profile-settings";

export default function ProfilePage() {
	return (
		<div className="container py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Настройки профиля</h1>
				<p className="text-sm text-muted-foreground">
					Управляйте паролем и выбранной компанией.
				</p>
			</div>
			<ProfileSettings />
		</div>
	);
}
