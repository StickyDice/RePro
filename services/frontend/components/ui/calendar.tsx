"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	...props
}: CalendarProps) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("relative p-3", className)}
			classNames={{
				months: "flex flex-col gap-4 sm:flex-row",
				month: "flex flex-col gap-4",
				month_caption: "flex h-9 w-full items-center justify-center",
				caption_label: "text-sm font-medium",
				nav: "absolute inset-x-3 top-3 flex items-center justify-between",
				button_previous: cn(
					buttonVariants({ variant: "outline" }),
					"size-8 bg-background p-0 opacity-70 hover:opacity-100",
				),
				button_next: cn(
					buttonVariants({ variant: "outline" }),
					"size-8 bg-background p-0 opacity-70 hover:opacity-100",
				),
				month_grid: "mx-auto w-auto border-collapse",
				weekdays: "grid grid-cols-7 gap-1",
				weekday:
					"flex h-9 w-10 items-center justify-center rounded-md text-[0.8rem] font-normal text-muted-foreground",
				week: "mt-1 grid grid-cols-7 gap-1",
				day: "relative flex h-10 w-10 items-center justify-center p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
				day_button: cn(
					buttonVariants({ variant: "ghost" }),
					"size-10 p-0 font-normal aria-selected:opacity-100",
				),
				range_start: "day-range-start rounded-l-md",
				range_end: "day-range-end rounded-r-md",
				selected:
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
				today: "bg-accent text-accent-foreground",
				outside:
					"day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
				disabled: "text-muted-foreground opacity-50",
				range_middle:
					"aria-selected:bg-accent aria-selected:text-accent-foreground",
				hidden: "invisible",
				...classNames,
			}}
			components={{
				Chevron: ({ orientation }) =>
					orientation === "left" ? (
						<ChevronLeft className="size-4" />
					) : (
						<ChevronRight className="size-4" />
					),
			}}
			{...props}
		/>
	);
}
Calendar.displayName = "Calendar";

export { Calendar };
