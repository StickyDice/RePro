"use client";

import { CompanyApplicationForm } from "@features/company-application/company-application-form";

export function CompanyApplicationFlow() {
	return (
		<div className="container max-w-2xl py-8">
			<h1 className="mb-6 text-2xl font-bold">Apply for company access</h1>
			<CompanyApplicationForm />
		</div>
	);
}
