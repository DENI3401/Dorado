/**
 * Wspólne dane i przygotowanie dla testów komponentów zakładki Subskrypcje (środowisko jsdom).
 * Plik nie jest testem — importują go pliki *.test.tsx.
 */
import { vi } from "vitest";
import { useCategoriesStore } from "@/features/categories/store";
import type { Category } from "@/features/categories/types";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import type { Subscription } from "@/features/subscriptions/types";
import { useTransactionsStore } from "@/features/transactions/store";

/** „Dziś” we wszystkich testach komponentów: sobota 28.11.2026 (czas lokalny). */
export const TODAY = "2026-11-28";

/** Zamraża tylko datę (timery zostają prawdziwe, więc user-event działa normalnie). */
export function pinToday(): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 28, 12, 0, 0));
}

/** Puste magazyny i localStorage przed każdym testem (magazyny są wspólne w obrębie pliku). */
export function resetStores(): void {
  localStorage.clear();
  useSubscriptionsStore.setState({ subscriptions: [] });
  useCategoriesStore.setState({ customCategories: [] });
  useTransactionsStore.setState({ transactions: [] });
}

let sequence = 0;

export function makeSubscription(over: Partial<Subscription> = {}): Subscription {
  sequence += 1;
  return {
    id: `s-${sequence}`,
    name: "Netflix",
    amount: 43,
    categoryId: "cat-expense-subscriptions",
    period: "monthly",
    startDate: "2026-09-05",
    endDate: null,
    isActive: true,
    note: "",
    createdAt: "2026-09-01T10:00:00.000Z",
    ...over,
  };
}

export function makeCategory(over: Partial<Category> & Pick<Category, "id" | "name">): Category {
  return { type: "expense", icon: "Ellipsis", color: "#64748b", isDefault: false, ...over };
}

/** Własne kategorie jak w demo: jedna utworzona dla subskrypcji, dwie zwykłe z Transakcji. */
export const insuranceCategory = makeCategory({
  id: "c-insurance",
  name: "Ubezpieczenia",
  icon: "ShieldCheck",
  color: "#22c55e",
  forSubscriptions: true,
});
export const sportCategory = makeCategory({ id: "c-sport", name: "Sport", icon: "Dumbbell" });
export const coffeeCategory = makeCategory({ id: "c-coffee", name: "Kawiarnie", icon: "Coffee" });

export function seedCategories(categories: Category[] = [insuranceCategory, sportCategory, coffeeCategory]): void {
  useCategoriesStore.setState({ customCategories: categories });
}

export function seedSubscriptions(subscriptions: Subscription[]): void {
  useSubscriptionsStore.setState({ subscriptions });
}
