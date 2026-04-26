export const NO_COMPANY_SELECTED_MESSAGE =
	"Сначала выберите компанию, чтобы открыть эту страницу.";

export function getStoredCompanyId(): string | null {
	if (typeof window === "undefined") {
		return null;
	}

	const companyId = localStorage.getItem("companyId")?.trim();
	return companyId ? companyId : null;
}
