import { Injectable } from "@nestjs/common";
import type { CalendarProvider } from "./calendar-provider.interface";

@Injectable()
export class NoopCalendarProvider implements CalendarProvider {
	async createEvent(params: {
		resourceName: string;
		startAt: Date;
		endAt: Date;
		userEmail: string;
		companyName: string;
		comment?: string;
	}): Promise<string | null> {
		const fakeId = `noop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
		console.log("[NoopCalendarProvider] createEvent:", {
			resourceName: params.resourceName,
			startAt: params.startAt,
			endAt: params.endAt,
			userEmail: params.userEmail,
			companyName: params.companyName,
			comment: params.comment,
			fakeEventId: fakeId,
		});
		return fakeId;
	}

	async deleteEvent(eventId: string): Promise<void> {
		console.log("[NoopCalendarProvider] deleteEvent:", { eventId });
	}

	async updateEvent(
		eventId: string,
		params: {
			resourceName?: string;
			startAt?: Date;
			endAt?: Date;
			comment?: string;
		},
	): Promise<void> {
		console.log("[NoopCalendarProvider] updateEvent:", { eventId, params });
	}
}
