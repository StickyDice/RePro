import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CALENDAR_PROVIDER } from "./calendar.constants";
import type { CalendarProvider } from "./calendar-provider.interface";
import { GoogleCalendarProvider } from "./google-calendar.provider";
import { NoopCalendarProvider } from "./noop-calendar.provider";

@Module({
	imports: [ConfigModule],
	providers: [
		NoopCalendarProvider,
		GoogleCalendarProvider,
		{
			provide: CALENDAR_PROVIDER,
			useFactory: (
				config: ConfigService,
				noop: NoopCalendarProvider,
				google: GoogleCalendarProvider,
			): CalendarProvider => {
				const provider = config.get<string>("CALENDAR_PROVIDER") ?? "noop";
				return provider === "google" ? google : noop;
			},
			inject: [ConfigService, NoopCalendarProvider, GoogleCalendarProvider],
		},
	],
	exports: [CALENDAR_PROVIDER],
})
export class CalendarModule {}
