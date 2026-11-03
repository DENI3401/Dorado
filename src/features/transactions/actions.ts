import { FALLBACK_CATEGORY_ID } from "@/features/categories/defaultCategories";
import { useCategoriesStore } from "@/features/categories/store";
import type { Category } from "@/features/categories/types";
import { useTransactionsStore } from "./store";

export type DeleteCategoryResult =
  | { ok: true; category: Category; reassigned: number }
  | { ok: false; reason: "not_found" | "default" };

/**
 * Usuwa własną kategorię. Operacje, które jej używały, trafiają do kategorii
 * zapasowej ("Inne wydatki" / "Inne przychody"), więc historia nie traci spójności.
 */
export function deleteCategory(id: string): DeleteCategoryResult {
  const categories = useCategoriesStore.getState();
  const category = categories.customCategories.find((c) => c.id === id);
  if (!category) return { ok: false, reason: "not_found" };
  if (category.isDefault) return { ok: false, reason: "default" };

  const reassigned = useTransactionsStore
    .getState()
    .reassignCategory(id, FALLBACK_CATEGORY_ID[category.type]);
  categories.removeCategory(id);
  return { ok: true, category, reassigned };
}

/** Liczba operacji przypisanych do kategorii (do tekstu w modalu potwierdzenia). */
export function countTransactionsInCategory(categoryId: string): number {
  return useTransactionsStore
    .getState()
    .transactions.filter((t) => t.categoryId === categoryId).length;
}
