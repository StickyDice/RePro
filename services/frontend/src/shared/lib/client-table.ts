/** Клиентская фильтрация и сортировка строк таблиц без запросов к API. */

export type SortDirection = "asc" | "desc";

export function normalizeSearch(s: string): string {
	return s.trim().toLowerCase();
}

export function filterBySearch<T>(
	items: T[],
	query: string,
	toSearchString: (item: T) => string,
): T[] {
	const q = normalizeSearch(query);
	if (!q) return items;
	return items.filter((item) =>
		normalizeSearch(toSearchString(item)).includes(q),
	);
}

function comparePrimitives(
	a: string | number,
	b: string | number,
	mult: number,
): number {
	if (typeof a === "number" && typeof b === "number") {
		if (a === b) return 0;
		return a < b ? -mult : mult;
	}
	const sa = String(a).toLocaleLowerCase();
	const sb = String(b).toLocaleLowerCase();
	return sa.localeCompare(sb, undefined, { sensitivity: "base" }) * mult;
}

/** Сортировка по ключу столбца; порядок — по возрастанию либо убыванию. */
export function sortByColumn<T, K extends string>(
	items: T[],
	sortKey: K | null,
	sortDir: SortDirection,
	getValue: (item: T, key: K) => string | number,
): T[] {
	if (!sortKey) return items;
	const mult = sortDir === "asc" ? 1 : -1;
	return [...items].sort((a, b) =>
		comparePrimitives(getValue(a, sortKey), getValue(b, sortKey), mult),
	);
}

/** Новый столбец — по возрастанию; тот же столбец переключает направление. */
export function toggleSortColumn<K extends string>(
	currentKey: K | null,
	currentDir: SortDirection,
	clickedKey: K,
): { sortKey: K | null; sortDir: SortDirection } {
	if (currentKey !== clickedKey) {
		return { sortKey: clickedKey, sortDir: "asc" };
	}
	return {
		sortKey: clickedKey,
		sortDir: currentDir === "asc" ? "desc" : "asc",
	};
}
