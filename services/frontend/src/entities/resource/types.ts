export interface Resource {
	id: string;
	name: string;
	code: string;
	description: string | null;
	category: string | null;
	quantity_total: number;
	quantity_active: number;
	is_active: boolean;
}
