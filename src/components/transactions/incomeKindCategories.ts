import { FALLBACK_CATEGORY_ID } from "@/features/categories/defaultCategories";
import type { Category } from "@/features/categories/types";
import type { IncomeKind } from "@/features/transactions/types";

const SALARY_CATEGORY_ID = "cat-income-salary";
const BONUS_CATEGORY_ID = "cat-income-bonus";

/** Które domyślne kategorie przychodu pasują do rodzaju przychodu. */
const DEFAULT_CATEGORY_IDS_BY_KIND: Record<IncomeKind, readonly string[]> = {
  salary: [SALARY_CATEGORY_ID],
  bonus: [BONUS_CATEGORY_ID, FALLBACK_CATEGORY_ID.income],
};

/**
 * Czy kategorię można wybrać przy danym rodzaju przychodu.
 * - Wynagrodzenie stałe: tylko „Wynagrodzenie”.
 * - Premia / dochód dodatkowy: tylko „Premia” i „Inne przychody”.
 * - Własne kategorie użytkownika są dostępne zawsze (nie wiemy, do jakiego rodzaju należą),
 *   a wydatki i brak rodzaju nie są filtrowane.
 */
export function isCategoryAllowedForIncomeKind(
  category: Category,
  kind: IncomeKind | null | undefined,
): boolean {
  if (!kind || category.type !== "income" || !category.isDefault) return true;
  return DEFAULT_CATEGORY_IDS_BY_KIND[kind].includes(category.id);
}

export function categoriesForIncomeKind(
  categories: readonly Category[],
  kind: IncomeKind | null | undefined,
): Category[] {
  return categories.filter((category) => isCategoryAllowedForIncomeKind(category, kind));
}
