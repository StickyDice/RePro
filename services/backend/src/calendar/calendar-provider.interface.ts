/**
 * Calendar provider interface for creating, updating, and deleting events.
 * Implementations: GoogleCalendarProvider (production), NoopCalendarProvider (dev/tests).
 */
export interface CalendarProvider {
	createEvent(params: {
		resourceName: string;
		startAt: Date;
		endAt: Date;
		userEmail: string;
		companyName: string;
		comment?: string;
	}): Promise<string | null>;

	deleteEvent(eventId: string): Promise<void>;

	updateEvent(
		eventId: string,
		params: {
			resourceName?: string;
			startAt?: Date;
			endAt?: Date;
			comment?: string;
		},
	): Promise<void>;
}
