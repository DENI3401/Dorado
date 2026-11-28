/**
 * Które kategorie pokazać w formularzu subskrypcji (czysta logika, bez Reacta).
 *
 * Subskrypcja to stała, powtarzalna opłata, więc lista nie zawiera kategorii jednorazowych
 * zakupów (jedzenie, zakupy, rozrywka) — tylko kategorie płatności cyklicznych.
 */
import {
  FALLBACK_CATEGORY_ID,
  SUBSCRIPTIONS_CATEGORY_ID,
  isSubscriptionCategory,
} from "@/features/categories/defaultCategories";
import type { Category } from "@/features/categories/types";

interface SubscriptionCategoryOptionsParams {
  /** Kategorie, których używają już jakieś subskrypcje (np. własna „Sport” z karnetem). */
  usedIds?: ReadonlySet<string>;
  /** Aktualnie wybrana kategoria — zostaje widoczna zawsze (np. przy edycji starszej subskrypcji). */
  selectedId?: string;
}

/**
 * Kategorie do wyboru w formularzu subskrypcji:
 * - kategorie płatności cyklicznych (`isSubscriptionCategory`): domyślne „Subskrypcje”,
 *   „Transport”, „Mieszkanie”, „Rachunki”, „Zdrowie”, „Inne wydatki” i własne utworzone dla subskrypcji,
 * - kategorie wydatków, w których są już subskrypcje (dane sprzed tej funkcji, import kopii),
 * - wybrana kategoria.
 *
 * Kolejność: „Subskrypcje” (wartość domyślna) na początku, „Inne wydatki” na końcu,
 * reszta w kolejności wejściowej (domyślne, potem własne w kolejności dodania).
 */
export function subscriptionCategoryOptions(
  categories: readonly Category[],
  { usedIds, selectedId }: SubscriptionCategoryOptionsParams = {},
): Category[] {
  const visible = categories.filter(
    (c) =>
      c.type === "expense" &&
      (isSubscriptionCategory(c) || usedIds?.has(c.id) === true || c.id === selectedId),
  );
  const rank = (c: Category) =>
    c.id === SUBSCRIPTIONS_CATEGORY_ID ? 0 : c.id === FALLBACK_CATEGORY_ID.expense ? 2 : 1;
  // Array.prototype.sort jest stabilne — w obrębie tej samej rangi kolejność wejściowa zostaje.
  return visible.sort((a, b) => rank(a) - rank(b));
}

/** Id kategorii używanych przez subskrypcje — parametr `usedIds` dla listy w formularzu. */
export function categoryIdsInUse(subscriptions: readonly { categoryId: string }[]): Set<string> {
  return new Set(subscriptions.map((s) => s.categoryId));
}
