import Link from "next/link";
import { CompanyApplicationFlow } from "@/src/processes/onboarding/company-application-flow";

export default function CompanyApplicationPage() {
	return (
		<div className="min-h-screen p-8">
			<Link
				href="/"
				className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
			>
				← На главную
			</Link>
			<CompanyApplicationFlow />
		</div>
	);
}
