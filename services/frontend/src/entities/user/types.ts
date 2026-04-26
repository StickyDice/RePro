export type UserStatus = "active" | "pending_verification" | "disabled";

export interface MembershipCompany {
	id: string;
	name: string;
	inn: string;
}

export interface MembershipRole {
	id: string;
	name: string;
	code: string;
	priority: number;
}

export interface Membership {
	id: string;
	company_id: string;
	is_default_company: boolean;
	company: MembershipCompany;
	role: MembershipRole;
}

export interface User {
	id: string;
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	patronymic: string | null;
	status: UserStatus;
	isPlatformAdmin?: boolean;
	memberships: Membership[];
}
