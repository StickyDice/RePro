import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
			<div className="text-center space-y-4">
				<h1 className="text-4xl font-bold">RePro</h1>
				<p className="text-muted-foreground">
					Resource booking platform for companies
				</p>
			</div>
			<div className="flex flex-wrap gap-4 justify-center">
				<Button asChild>
					<Link href="/company-application">Apply for company access</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/login">Sign in</Link>
				</Button>
			</div>
		</div>
	);
}
