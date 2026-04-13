import { CompanyApplicationFlow } from "@/src/processes/onboarding/company-application-flow";
import Link from "next/link";

export default function CompanyApplicationPage() {
	return (
		<div className="min-h-screen p-8">
			<Link
				href="/"
				className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
			>
				← Back to home
			</Link>
			<CompanyApplicationFlow />
		</div>
	);
}
