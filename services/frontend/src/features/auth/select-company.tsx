"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@shared/api/client";
import type { User } from "@entities/user/types";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@shared/ui";

interface SelectCompanyProps {
	user: User;
}

export function SelectCompany({ user }: SelectCompanyProps) {
	const router = useRouter();
	const [loading, setLoading] = useState<string | null>(null);

	async function handleSelect(companyId: string) {
		setLoading(companyId);
		try {
			await apiFetch("/auth/select-company", {
				method: "POST",
				body: JSON.stringify({ companyId }),
			});
			if (typeof window !== "undefined") {
				localStorage.setItem("companyId", companyId);
			}
			router.push("/dashboard");
			router.refresh();
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(null);
		}
	}

	const companies = user.memberships.map((m) => m.company);

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Select company</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{companies.map((company) => (
					<Button
						key={company.id}
						variant="outline"
						className="w-full justify-start"
						onClick={() => handleSelect(company.id)}
						disabled={loading !== null}
					>
						{loading === company.id ? "Selecting..." : company.name}
					</Button>
				))}
			</CardContent>
		</Card>
	);
}
