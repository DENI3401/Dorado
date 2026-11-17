import { FALLBACK_CATEGORY_ID } from "@/features/categories/defaultCategories";
import { useCategoriesStore } from "@/features/categories/store";
import type { Category } from "@/features/categories/types";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import { useTransactionsStore } from "./store";

export type DeleteCategoryResult =
  | {
      ok: true;
      category: Category;
      /** Liczba przeniesionych transakcji. */
      reassigned: number;
      /** Liczba przeniesionych subskrypcji. */
      reassignedSubscriptions: number;
    }
  | { ok: false; reason: "not_found" | "default" };

/**
 * Usuwa własną kategorię. Operacje i subskrypcje, które jej używały, trafiają do
 * kategorii zapasowej ("Inne wydatki" / "Inne przychody"), więc dane nie tracą spójności.
 */
export function deleteCategory(id: string): DeleteCategoryResult {
  const categories = useCategoriesStore.getState();
  const category = categories.customCategories.find((c) => c.id === id);
  if (!category) return { ok: false, reason: "not_found" };
  if (category.isDefault) return { ok: false, reason: "default" };

  const fallbackId = FALLBACK_CATEGORY_ID[category.type];
  const reassigned = useTransactionsStore.getState().reassignCategory(id, fallbackId);
  const reassignedSubscriptions = useSubscriptionsStore
    .getState()
    .reassignCategory(id, fallbackId);
  categories.removeCategory(id);
  return { ok: true, category, reassigned, reassignedSubscriptions };
}

/** Liczba operacji przypisanych do kategorii (do tekstu w modalu potwierdzenia). */
export function countTransactionsInCategory(categoryId: string): number {
  return useTransactionsStore
    .getState()
    .transactions.filter((t) => t.categoryId === categoryId).length;
}

/** Liczba subskrypcji przypisanych do kategorii (do tekstu w modalu potwierdzenia). */
export function countSubscriptionsInCategory(categoryId: string): number {
  return useSubscriptionsStore
    .getState()
    .subscriptions.filter((s) => s.categoryId === categoryId).length;
}
