import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLANS = [
	{ code: "basic", name: "Basic", description: "Basic plan for small teams" },
	{ code: "pro", name: "Pro", description: "Pro plan for growing businesses" },
	{
		code: "enterprise",
		name: "Enterprise",
		description: "Enterprise plan for large organizations",
	},
] as const;

const DEFAULT_ROLES = [
	{ code: "employee", name: "Employee", priority: 10 },
	{ code: "support", name: "Support", priority: 20 },
	{ code: "moderator", name: "Moderator", priority: 30 },
	{ code: "company_admin", name: "Company Admin", priority: 40 },
] as const;

async function main() {
	// Seed plans (basic, pro, enterprise)
	for (const plan of PLANS) {
		await prisma.plan.upsert({
			where: { code: plan.code },
			create: {
				code: plan.code,
				name: plan.name,
				description: plan.description ?? null,
				is_active: true,
			},
			update: {
				name: plan.name,
				description: plan.description ?? null,
			},
		});
	}
	console.log(`Seeded plans: ${PLANS.map((p) => p.code).join(", ")}`);

	// Seed default roles for each existing company
	const companies = await prisma.company.findMany({ select: { id: true } });

	for (const company of companies) {
		for (const role of DEFAULT_ROLES) {
			await prisma.role.upsert({
				where: {
					company_id_code: { company_id: company.id, code: role.code },
				},
				create: {
					company_id: company.id,
					code: role.code,
					name: role.name,
					priority: role.priority,
					description: `Default ${role.name} role`,
					is_system: true,
				},
				update: {
					name: role.name,
					priority: role.priority,
				},
			});
		}
	}

	console.log(`Seeded default roles for ${companies.length} companies`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
