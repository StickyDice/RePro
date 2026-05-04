import { PrismaClient } from "@prisma/client";
import {
	createClient,
	type SupabaseClient,
	type User as SupabaseUser,
} from "@supabase/supabase-js";

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
	{ code: "employee", name: "Сотрудник", priority: 10 },
	{ code: "support", name: "Поддержка", priority: 20 },
	{ code: "moderator", name: "Модератор", priority: 30 },
	{ code: "company_admin", name: "Администратор компании", priority: 40 },
] as const;

const DEMO_EXTRA_ROLES = [
	{ code: "owner", name: "Владелец", priority: 50 },
] as const;

const DEMO_COMPANIES = [
	{
		name: 'ООО "Северный Прокат"',
		inn: "7701000001",
		contactEmail: "admin@north-rent.demo",
		contactPhone: "+79990000001",
		contactFirstName: "Анна",
		contactLastName: "Северова",
		planCode: "enterprise",
	},
	{
		name: 'ООО "Городские Ресурсы"',
		inn: "7701000002",
		contactEmail: "admin@city-resources.demo",
		contactPhone: "+79990000002",
		contactFirstName: "Иван",
		contactLastName: "Городецкий",
		planCode: "pro",
	},
	{
		name: 'АО "Технопарк Восток"',
		inn: "7701000003",
		contactEmail: "admin@tech-vostok.demo",
		contactPhone: "+79990000003",
		contactFirstName: "Мария",
		contactLastName: "Восточная",
		planCode: "enterprise",
	},
	{
		name: 'ООО "Логистика Плюс"',
		inn: "7701000004",
		contactEmail: "admin@logistics-plus.demo",
		contactPhone: "+79990000004",
		contactFirstName: "Павел",
		contactLastName: "Логинов",
		planCode: "pro",
	},
	{
		name: 'ООО "Креатив Лаб"',
		inn: "7701000005",
		contactEmail: "admin@creative-lab.demo",
		contactPhone: "+79990000005",
		contactFirstName: "Елена",
		contactLastName: "Лабина",
		planCode: "basic",
	},
	{
		name: 'АО "Инженерный Центр"',
		inn: "7701000006",
		contactEmail: "admin@engineering-center.demo",
		contactPhone: "+79990000006",
		contactFirstName: "Дмитрий",
		contactLastName: "Инженеров",
		planCode: "enterprise",
	},
] as const;

const RESOURCE_TEMPLATES = [
	{ name: "Переговорная малая", code: "meeting-small", category: "Помещения" },
	{
		name: "Переговорная большая",
		code: "meeting-large",
		category: "Помещения",
	},
	{ name: "Конференц-зал", code: "conference-hall", category: "Помещения" },
	{ name: "Учебный класс", code: "training-room", category: "Помещения" },
	{ name: "Проектор", code: "projector", category: "Оборудование" },
	{ name: "Экран мобильный", code: "screen", category: "Оборудование" },
	{ name: "Ноутбук", code: "laptop", category: "Техника" },
	{ name: "Планшет", code: "tablet", category: "Техника" },
	{
		name: "Комплект микрофонов",
		code: "microphones",
		category: "Оборудование",
	},
	{ name: "Фотоаппарат", code: "camera", category: "Техника" },
	{ name: "Видеокамера", code: "video-camera", category: "Техника" },
	{ name: "Световой комплект", code: "light-kit", category: "Оборудование" },
	{ name: "3D-принтер", code: "3d-printer", category: "Лаборатория" },
	{
		name: "Паяльная станция",
		code: "soldering-station",
		category: "Лаборатория",
	},
	{
		name: "Измерительный комплект",
		code: "measure-kit",
		category: "Лаборатория",
	},
	{ name: "Служебный автомобиль", code: "car", category: "Транспорт" },
	{ name: "Грузовой фургон", code: "van", category: "Транспорт" },
	{ name: "Велосипед курьерский", code: "bike", category: "Транспорт" },
	{
		name: "Стенд для презентаций",
		code: "demo-stand",
		category: "Мероприятия",
	},
	{ name: "Комплект бейджей", code: "badge-kit", category: "Мероприятия" },
] as const;

const FIRST_NAMES = [
	"Алексей",
	"Мария",
	"Дмитрий",
	"Елена",
	"Иван",
	"Ольга",
	"Сергей",
	"Анна",
	"Павел",
	"Наталья",
] as const;

const LAST_NAMES = [
	"Иванов",
	"Петрова",
	"Сидоров",
	"Смирнова",
	"Кузнецов",
	"Васильева",
	"Новиков",
	"Федорова",
	"Морозов",
	"Волкова",
] as const;

type RoleSeed = {
	code: string;
	name: string;
	priority: number;
	isSystem: boolean;
};

const DEMO_ROLES: RoleSeed[] = [
	...DEFAULT_ROLES.map((role) => ({ ...role, isSystem: true })),
	...DEMO_EXTRA_ROLES.map((role) => ({ ...role, isSystem: false })),
];

let supabaseAdmin: SupabaseClient | null | undefined;
let authUsersByEmail: Map<string, SupabaseUser> | null = null;

function userName(index: number) {
	return {
		firstName: FIRST_NAMES[index % FIRST_NAMES.length],
		lastName:
			LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length],
	};
}

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

function getSupabaseAdmin() {
	if (supabaseAdmin !== undefined) {
		return supabaseAdmin;
	}

	const supabaseUrl = process.env.SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		console.warn(
			"SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing; skipping Supabase Auth demo users.",
		);
		supabaseAdmin = null;
		return supabaseAdmin;
	}

	supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
	return supabaseAdmin;
}

async function loadAuthUsersByEmail(client: SupabaseClient) {
	if (authUsersByEmail) {
		return authUsersByEmail;
	}

	const users = new Map<string, SupabaseUser>();
	let page = 1;
	const perPage = 1000;

	while (true) {
		const { data, error } = await client.auth.admin.listUsers({
			page,
			perPage,
		});
		if (error) {
			throw new Error(`Failed to list Supabase Auth users: ${error.message}`);
		}

		for (const user of data.users) {
			if (user.email) {
				users.set(normalizeEmail(user.email), user);
			}
		}

		if (data.users.length < perPage) {
			break;
		}
		page += 1;
	}

	authUsersByEmail = users;
	return authUsersByEmail;
}

async function ensureAuthUser(params: {
	email: string;
	firstName: string;
	lastName: string;
	publicUserId: string;
	currentSupabaseAuthId: string | null;
}) {
	const client = getSupabaseAdmin();
	if (!client) {
		return;
	}

	const password = params.email;
	const usersByEmail = await loadAuthUsersByEmail(client);
	const normalizedEmail = normalizeEmail(params.email);
	const existing =
		params.currentSupabaseAuthId !== null
			? ({ id: params.currentSupabaseAuthId } as SupabaseUser)
			: usersByEmail.get(normalizedEmail);

	if (existing) {
		const { error } = await client.auth.admin.updateUserById(existing.id, {
			password,
			email_confirm: true,
			user_metadata: {
				first_name: params.firstName,
				last_name: params.lastName,
			},
		});
		if (error) {
			throw new Error(
				`Failed to update Supabase Auth user ${params.email}: ${error.message}`,
			);
		}

		await prisma.user.update({
			where: { id: params.publicUserId },
			data: { supabase_auth_id: existing.id },
		});
		return;
	}

	const { data, error } = await client.auth.admin.createUser({
		email: params.email,
		password,
		email_confirm: true,
		user_metadata: {
			first_name: params.firstName,
			last_name: params.lastName,
		},
	});

	if (error || !data.user) {
		throw new Error(
			`Failed to create Supabase Auth user ${params.email}: ${
				error?.message ?? "empty response"
			}`,
		);
	}

	usersByEmail.set(normalizedEmail, data.user);

	await prisma.user.update({
		where: { id: params.publicUserId },
		data: { supabase_auth_id: data.user.id },
	});
}

async function seedPlans() {
	const plans = new Map<string, string>();

	for (const plan of PLANS) {
		const saved = await prisma.plan.upsert({
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
				is_active: true,
			},
		});
		plans.set(saved.code, saved.id);
	}

	console.log(`Seeded plans: ${PLANS.map((p) => p.code).join(", ")}`);
	return plans;
}

async function upsertDemoCompany(
	company: (typeof DEMO_COMPANIES)[number],
	planId: string | undefined,
) {
	const data = {
		name: company.name,
		inn: company.inn,
		contact_email: company.contactEmail,
		contact_phone: company.contactPhone,
		contact_first_name: company.contactFirstName,
		contact_last_name: company.contactLastName,
		contact_patronymic: null,
		subscription_status: "active",
		selected_plan_id: planId,
	};
	const existing = await prisma.company.findFirst({
		where: { inn: company.inn },
		select: { id: true },
	});

	if (existing) {
		return prisma.company.update({
			where: { id: existing.id },
			data,
		});
	}

	return prisma.company.create({ data });
}

async function seedRolesForCompany(
	companyId: string,
	includeDemoRoles = false,
) {
	const roles = includeDemoRoles ? DEMO_ROLES : DEFAULT_ROLES;
	const savedRoles = new Map<string, string>();

	for (const role of roles) {
		const isSystem = "isSystem" in role ? role.isSystem : true;
		const saved = await prisma.role.upsert({
			where: {
				company_id_code: { company_id: companyId, code: role.code },
			},
			create: {
				company_id: companyId,
				code: role.code,
				name: role.name,
				priority: role.priority,
				description: `${isSystem ? "Системная" : "Демо"} роль: ${role.name}`,
				is_system: isSystem,
			},
			update: {
				name: role.name,
				priority: role.priority,
				description: `${isSystem ? "Системная" : "Демо"} роль: ${role.name}`,
				is_system: isSystem,
			},
		});
		savedRoles.set(saved.code, saved.id);
	}

	return savedRoles;
}

function sharedUserEmails(companyIndex: number) {
	const prefix = companyIndex < 3 ? "alpha" : "beta";
	return Array.from(
		{ length: 5 },
		(_, index) => `demo.shared.${prefix}.${index + 1}@repro.local`,
	);
}

function companyUserEmails(companyIndex: number) {
	return Array.from(
		{ length: 45 },
		(_, index) =>
			`demo.company${companyIndex + 1}.user${String(index + 1).padStart(2, "0")}@repro.local`,
	);
}

async function upsertUser(email: string, index: number) {
	const name = userName(index);
	const phoneSuffix = String(index + 1).padStart(6, "0");

	const user = await prisma.user.upsert({
		where: { email },
		create: {
			email,
			phone_number: `+7988${phoneSuffix}`,
			first_name: name.firstName,
			last_name: name.lastName,
			patronymic: null,
			status: "active",
		},
		update: {
			first_name: name.firstName,
			last_name: name.lastName,
			status: "active",
		},
	});

	await ensureAuthUser({
		email,
		firstName: name.firstName,
		lastName: name.lastName,
		publicUserId: user.id,
		currentSupabaseAuthId: user.supabase_auth_id,
	});

	return user;
}

function roleCodeForMember(index: number) {
	if (index === 0) return "owner";
	if (index <= 3) return "company_admin";
	if (index <= 8) return "moderator";
	if (index <= 17) return "support";
	return "employee";
}

async function seedMembershipsForCompany(
	companyId: string,
	companyIndex: number,
	roleIds: Map<string, string>,
	defaultCompanyByEmail: Map<string, string>,
) {
	const emails = [
		...sharedUserEmails(companyIndex),
		...companyUserEmails(companyIndex),
	];

	for (const [index, email] of emails.entries()) {
		const globalIndex = companyIndex * 100 + index;
		const user = await upsertUser(email, globalIndex);
		const roleCode = roleCodeForMember(index);
		const roleId = roleIds.get(roleCode) ?? roleIds.get("employee");
		if (!roleId) {
			throw new Error(`Role "${roleCode}" is missing for company ${companyId}`);
		}

		if (!defaultCompanyByEmail.has(email)) {
			defaultCompanyByEmail.set(email, companyId);
		}

		await prisma.membership.upsert({
			where: {
				company_id_user_id: { company_id: companyId, user_id: user.id },
			},
			create: {
				company_id: companyId,
				user_id: user.id,
				role_id: roleId,
				status: "active",
				is_default_company: defaultCompanyByEmail.get(email) === companyId,
			},
			update: {
				role_id: roleId,
				status: "active",
				is_default_company: defaultCompanyByEmail.get(email) === companyId,
			},
		});
	}
}

async function upsertResource(
	companyId: string,
	roleIds: Map<string, string>,
	template: (typeof RESOURCE_TEMPLATES)[number],
	index: number,
) {
	const minRoleCode =
		index % 5 === 0 ? "moderator" : index % 4 === 0 ? "support" : "employee";
	const data = {
		name: template.name,
		code: template.code,
		description: `Демо-ресурс для проверки бронирования: ${template.name}`,
		category: template.category,
		quantity_total: (index % 4) + 1,
		quantity_active: index % 7 === 0 ? 0 : (index % 4) + 1,
		min_role_id: roleIds.get(minRoleCode) ?? null,
		is_active: true,
	};
	const existing = await prisma.resource.findFirst({
		where: { company_id: companyId, code: template.code },
		select: { id: true },
	});

	if (existing) {
		await prisma.resource.update({
			where: { id: existing.id },
			data,
		});
		return;
	}

	await prisma.resource.create({
		data: {
			company_id: companyId,
			...data,
		},
	});
}

async function seedResourcesForCompany(
	companyId: string,
	roleIds: Map<string, string>,
) {
	for (const [index, resource] of RESOURCE_TEMPLATES.entries()) {
		await upsertResource(companyId, roleIds, resource, index);
	}
}

async function seedDemoData(planIds: Map<string, string>) {
	const defaultCompanyByEmail = new Map<string, string>();
	let memberships = 0;
	let resources = 0;

	for (const [companyIndex, demoCompany] of DEMO_COMPANIES.entries()) {
		const company = await upsertDemoCompany(
			demoCompany,
			planIds.get(demoCompany.planCode),
		);
		const roleIds = await seedRolesForCompany(company.id, true);

		await seedMembershipsForCompany(
			company.id,
			companyIndex,
			roleIds,
			defaultCompanyByEmail,
		);
		await seedResourcesForCompany(company.id, roleIds);

		memberships += 50;
		resources += RESOURCE_TEMPLATES.length;
	}

	console.log(
		`Seeded demo data: ${DEMO_COMPANIES.length} companies, ${resources} resources, ${memberships} memberships`,
	);
	console.log(
		"Shared demo users: demo.shared.alpha.* belong to companies 1-3, demo.shared.beta.* belong to companies 4-6",
	);
	console.log(
		"Seeded Supabase Auth demo users with passwords equal to their emails",
	);
}

async function seedDefaultRolesForExistingCompanies() {
	const companies = await prisma.company.findMany({ select: { id: true } });

	for (const company of companies) {
		await seedRolesForCompany(company.id, false);
	}

	console.log(`Seeded default roles for ${companies.length} companies`);
}

async function main() {
	const planIds = await seedPlans();
	await seedDemoData(planIds);
	await seedDefaultRolesForExistingCompanies();
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
