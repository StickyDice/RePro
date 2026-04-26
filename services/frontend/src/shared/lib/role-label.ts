/**
 * Подписи системных ролей по коду (совпадают с сидом / platform-admin).
 * Кастомные роли показываем как `name` из API.
 */
const SYSTEM_ROLE_LABEL_RU: Record<string, string> = {
	employee: "Сотрудник",
	support: "Поддержка",
	moderator: "Модератор",
	company_admin: "Администратор компании",
};

export function formatRoleLabel(role: { code: string; name: string }): string {
	const fixed = SYSTEM_ROLE_LABEL_RU[role.code];
	if (fixed) {
		return fixed;
	}
	return role.name;
}
