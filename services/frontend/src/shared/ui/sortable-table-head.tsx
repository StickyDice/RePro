"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDirection } from "@shared/lib/client-table";
import { TableHead } from "@/components/ui/table";

interface SortableTableHeadProps {
	label: string;
	columnKey: string;
	activeKey: string | null;
	direction: SortDirection;
	onSort: (columnKey: string) => void;
	className?: string;
}

export function SortableTableHead({
	label,
	columnKey,
	activeKey,
	direction,
	onSort,
	className,
}: SortableTableHeadProps) {
	const active = activeKey === columnKey;
	return (
		<TableHead className={className}>
			<button
				type="button"
				onClick={() => onSort(columnKey)}
				className={cn(
					"-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
					active && "text-foreground",
				)}
			>
				<span>{label}</span>
				{active ? (
					direction === "asc" ? (
						<ArrowUp className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
					) : (
						<ArrowDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
					)
				) : (
					<ArrowUpDown
						className="h-4 w-4 shrink-0 opacity-40"
						aria-hidden
					/>
				)}
			</button>
		</TableHead>
	);
}
