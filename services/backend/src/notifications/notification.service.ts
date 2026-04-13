import { Injectable } from "@nestjs/common";

/**
 * Stub NotificationService - logs to console or pushes to a simple queue.
 * Real email implementation to be added later.
 * Interface: sendEmail(to, subject, template, data)
 */
@Injectable()
export class NotificationService {
	sendEmail(
		to: string,
		subject: string,
		template: string,
		data?: Record<string, unknown>,
	): void {
		// Stub: log to console. Real implementation would send email.
		console.log("[NotificationService] sendEmail stub:", {
			to,
			subject,
			template,
			data,
			timestamp: new Date().toISOString(),
		});
	}
}
