"use client";

import { apiFetch } from "@shared/api/client";
import { getStoredCompanyId } from "@shared/lib/selected-company";
import { createBrowserClient } from "@shared/lib/supabase";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@shared/ui";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/src/features/auth/auth-provider";

const MIN_PASSWORD_LENGTH = 6;

export function ProfileSettings() {
	const router = useRouter();
	const { profile, profileLoading } = useAuth();
	const [selectedCompanyId, setSelectedCompanyId] = useState("");
	const [savingCompany, setSavingCompany] = useState(false);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [savingPassword, setSavingPassword] = useState(false);

	useEffect(() => {
		if (!profile) return;

		const storedCompanyId = getStoredCompanyId();
		const hasStoredMembership = profile.memberships.some(
			(membership) => membership.company_id === storedCompanyId,
		);
		const defaultMembership =
			profile.memberships.find((membership) => membership.is_default_company) ??
			profile.memberships[0];

		setSelectedCompanyId(
			hasStoredMembership
				? (storedCompanyId ?? "")
				: (defaultMembership?.company_id ?? ""),
		);
	}, [profile]);

	const currentCompanyName = useMemo(() => {
		if (!profile) return null;
		return (
			profile.memberships.find(
				(membership) => membership.company_id === selectedCompanyId,
			)?.company.name ?? null
		);
	}, [profile, selectedCompanyId]);

	async function handleCompanySave() {
		if (!selectedCompanyId) {
			toast.error("Сначала выберите компанию.");
			return;
		}

		setSavingCompany(true);
		try {
			await apiFetch("/auth/select-company", {
				method: "POST",
				body: JSON.stringify({ companyId: selectedCompanyId }),
			});
			localStorage.setItem("companyId", selectedCompanyId);
			toast.success("Выбранная компания обновлена.");
			router.refresh();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Не удалось обновить компанию",
			);
		} finally {
			setSavingCompany(false);
		}
	}

	async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (password.length < MIN_PASSWORD_LENGTH) {
			toast.error(
				`Пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов.`,
			);
			return;
		}
		if (password !== confirmPassword) {
			toast.error("Пароли не совпадают.");
			return;
		}

		setSavingPassword(true);
		try {
			const supabase = createBrowserClient();
			const { error } = await supabase.auth.updateUser({ password });
			if (error) {
				throw error;
			}
			setPassword("");
			setConfirmPassword("");
			toast.success("Пароль обновлён.");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Не удалось обновить пароль",
			);
		} finally {
			setSavingPassword(false);
		}
	}

	if (profileLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!profile) {
		return null;
	}

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Аккаунт</CardTitle>
					<CardDescription>
						Измените пароль для входа и проверьте текущий email.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email для входа</Label>
						<Input
							id="email"
							value={profile.email ?? ""}
							readOnly
							disabled
							autoComplete="email"
						/>
					</div>
					<form
						className="space-y-4"
						onSubmit={(event) => void handlePasswordSubmit(event)}
					>
						<div className="space-y-2">
							<Label htmlFor="new-password">Новый пароль</Label>
							<Input
								id="new-password"
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								autoComplete="new-password"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Подтвердите пароль</Label>
							<Input
								id="confirm-password"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								autoComplete="new-password"
							/>
						</div>
						<Button type="submit" disabled={savingPassword}>
							{savingPassword ? "Сохранение пароля..." : "Обновить пароль"}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Компания</CardTitle>
					<CardDescription>
						Выберите компанию, которая будет использоваться на страницах этого
						браузера.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{profile.memberships.length > 1 ? (
						<>
							<div className="space-y-2">
								<Label htmlFor="selected-company">Выбранная компания</Label>
								<Select
									value={selectedCompanyId}
									onValueChange={setSelectedCompanyId}
								>
									<SelectTrigger id="selected-company">
										<SelectValue placeholder="Выберите компанию" />
									</SelectTrigger>
									<SelectContent>
										{profile.memberships.map((membership) => (
											<SelectItem
												key={membership.company_id}
												value={membership.company_id}
											>
												{membership.company.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								onClick={() => void handleCompanySave()}
								disabled={savingCompany}
							>
								{savingCompany
									? "Сохранение компании..."
									: "Обновить выбранную компанию"}
							</Button>
						</>
					) : profile.memberships.length === 1 ? (
						<p className="text-sm text-muted-foreground">
							Ваша активная компания:{" "}
							<span className="font-medium text-foreground">
								{currentCompanyName}
							</span>
							.
						</p>
					) : (
						<p className="text-sm text-muted-foreground">
							У вас пока нет привязанных компаний.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
