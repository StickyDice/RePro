import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { google } from "googleapis";
import type { CalendarProvider } from "./calendar-provider.interface";

interface GoogleServiceAccountCredentials {
	client_email?: string;
	private_key?: string;
	[key: string]: unknown;
}

@Injectable()
export class GoogleCalendarProvider implements CalendarProvider {
	private getCredentials(): GoogleServiceAccountCredentials {
		const credentialsStr = this.config.get<string>("GOOGLE_CALENDAR_CREDENTIALS");
		if (!credentialsStr) {
			throw new Error(
				"GOOGLE_CALENDAR_CREDENTIALS is required when CALENDAR_PROVIDER=google. Set JSON string or path to service account key file.",
			);
		}

		try {
			// Try parsing as JSON (inline credentials)
			return JSON.parse(credentialsStr) as GoogleServiceAccountCredentials;
		} catch {
			// Assume it's a file path
			// biome-ignore lint/security/noGlobalEval: dynamic require for credentials path
			const fs = require("node:fs");
			const path = require("node:path");
			const resolved = path.isAbsolute(credentialsStr)
				? credentialsStr
				: path.resolve(process.cwd(), credentialsStr);
			const content = fs.readFileSync(resolved, "utf-8");
			return JSON.parse(content) as GoogleServiceAccountCredentials;
		}
	}

	constructor(private readonly config: ConfigService) {}

	async createEvent(params: {
		resourceName: string;
		startAt: Date;
		endAt: Date;
		userEmail: string;
		companyName: string;
		comment?: string;
	}): Promise<string | null> {
		const credentials = this.getCredentials();
		const clientEmail =
			typeof credentials.client_email === "string"
				? credentials.client_email
				: undefined;
		const privateKey =
			typeof credentials.private_key === "string"
				? credentials.private_key
				: undefined;

		if (!clientEmail || !privateKey) {
			throw new Error(
				"GOOGLE_CALENDAR_CREDENTIALS must contain client_email and private_key",
			);
		}

		const auth = new google.auth.JWT({
			email: clientEmail,
			key: privateKey,
			scopes: ["https://www.googleapis.com/auth/calendar"],
			subject: params.userEmail, // domain-wide delegation: impersonate user
		});

		const calendar = google.calendar({ version: "v3", auth });

		const summary = `${params.resourceName} (${params.companyName})`;
		const description = params.comment
			? `Rental: ${params.resourceName}\nComment: ${params.comment}`
			: `Rental: ${params.resourceName}`;

		const event = {
			summary,
			description,
			start: {
				dateTime: params.startAt.toISOString(),
				timeZone: "UTC",
			},
			end: {
				dateTime: params.endAt.toISOString(),
				timeZone: "UTC",
			},
		};

		// Use user's primary calendar (email as calendarId)
		const calendarId = params.userEmail;

		const res = await calendar.events.insert({
			calendarId,
			requestBody: event,
		});

		const id = res.data.id ?? null;
		// Store composite "calendarId:eventId" so deleteEvent can target the correct calendar
		return id ? `${calendarId}:${id}` : null;
	}

	async deleteEvent(eventId: string): Promise<void> {
		const credentials = this.getCredentials();
		const clientEmail =
			typeof credentials.client_email === "string"
				? credentials.client_email
				: undefined;
		const privateKey =
			typeof credentials.private_key === "string"
				? credentials.private_key
				: undefined;

		if (!clientEmail || !privateKey) {
			throw new Error(
				"GOOGLE_CALENDAR_CREDENTIALS must contain client_email and private_key",
			);
		}

		// For delete we need to know which calendar. Event IDs from our create are in user calendars.
		// We store the event ID but not the calendar. Google Calendar API delete requires calendarId + eventId.
		// Options: 1) Store "calendarId:eventId" or 2) Store separately.
		// For domain-wide delegation we impersonated the user, so events are in user's primary calendar.
		// We need to store calendarId alongside eventId, or use a composite format.
		// The interface only has eventId. Let me check - we could store "userEmail|eventId" and split,
		// or add calendarId to the interface. Simpler: store "calendarId:eventId" in the DB.
		// Actually the requirement says "store google_event_id" - so we store just the event ID.
		// For delete, we need the calendar. So we have two choices:
		// A) Store "calendarId:eventId" in google_event_id (e.g. "user@domain.com:abc123")
		// B) Add google_calendar_id to RentalAllocation
		// C) In createEvent, return a composite ID that we parse in delete
		// I'll go with A - store "calendarId:eventId" so we can delete without schema change.
		// But wait - we're already only storing eventId in the spec. Let me re-read...
		// "Store google_event_id in RentalAllocation" - just the event ID.
		// So we need the calendar ID for delete. The user email (which is the calendar ID for primary) 
		// is on the RentalRequest -> User. So when we delete, we have access to the allocation's 
		// rental_request -> user -> email. So we can pass the calendar ID to deleteEvent!
		// Let me update the interface to accept optional calendarId for delete, or we could add it.
		// Actually the interface says deleteEvent(eventId). So we need another way.
		// Best approach: store "calendarId:eventId" in the column. It's a single string. On create we have
		// userEmail which is the calendarId. So we'll store `${params.userEmail}:${eventId}`.
		// On delete we parse it. This keeps the DB column as a single value.
		const [calendarId, actualEventId] = eventId.includes(":")
			? eventId.split(":", 2)
			: [undefined, eventId];

		if (!calendarId) {
			// Legacy or noop ID - can't delete in Google
			console.warn("[GoogleCalendarProvider] deleteEvent: no calendarId in eventId, skipping", {
				eventId,
			});
			return;
		}

		const auth = new google.auth.JWT({
			email: clientEmail,
			key: privateKey,
			scopes: ["https://www.googleapis.com/auth/calendar"],
			subject: calendarId, // impersonate user to delete from their calendar
		});

		const calendar = google.calendar({ version: "v3", auth });
		await calendar.events.delete({
			calendarId,
			eventId: actualEventId,
		});
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
		const credentials = this.getCredentials();
		const clientEmail =
			typeof credentials.client_email === "string"
				? credentials.client_email
				: undefined;
		const privateKey =
			typeof credentials.private_key === "string"
				? credentials.private_key
				: undefined;

		if (!clientEmail || !privateKey) {
			throw new Error(
				"GOOGLE_CALENDAR_CREDENTIALS must contain client_email and private_key",
			);
		}

		const [calendarId, actualEventId] = eventId.includes(":")
			? eventId.split(":", 2)
			: [undefined, eventId];

		if (!calendarId) {
			console.warn("[GoogleCalendarProvider] updateEvent: no calendarId in eventId, skipping", {
				eventId,
			});
			return;
		}

		const auth = new google.auth.JWT({
			email: clientEmail,
			key: privateKey,
			scopes: ["https://www.googleapis.com/auth/calendar"],
			subject: calendarId,
		});

		const calendar = google.calendar({ version: "v3", auth });

		const patch: Record<string, unknown> = {};
		if (params.resourceName !== undefined) patch.summary = params.resourceName;
		if (params.startAt !== undefined) {
			patch.start = {
				dateTime: params.startAt.toISOString(),
				timeZone: "UTC",
			};
		}
		if (params.endAt !== undefined) {
			patch.end = {
				dateTime: params.endAt.toISOString(),
				timeZone: "UTC",
			};
		}
		if (params.comment !== undefined) patch.description = params.comment;

		await calendar.events.patch({
			calendarId,
			eventId: actualEventId,
			requestBody: patch,
		});
	}
}
