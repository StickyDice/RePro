import type { z } from "zod";

export function zodToFormikErrors<T extends z.ZodType>(
	schema: T,
	values: unknown,
): Record<string, string> {
	const result = schema.safeParse(values);
	if (result.success) return {};
	const errors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const path = issue.path.join(".");
		if (path && !(path in errors)) {
			errors[path] = issue.message;
		}
	}
	return errors;
}
