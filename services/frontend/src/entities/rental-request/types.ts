export type RentalRequestStatus =
	| "pending"
	| "approved"
	| "rejected"
	| "cancelled"
	| "completed";

export interface RentalRequest {
	id: string;
	resource_id: string;
	user_id: string;
	requested_start_at: string;
	requested_end_at: string;
	request_comment?: string | null;
	status: RentalRequestStatus;
	resource?: { name: string; code: string };
	user?: { email?: string; first_name?: string; last_name?: string };
}
