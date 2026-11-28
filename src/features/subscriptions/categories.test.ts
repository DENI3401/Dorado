import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORIES,
  FALLBACK_CATEGORY_ID,
  SUBSCRIPTIONS_CATEGORY_ID,
} from "@/features/categories/defaultCategories";
import type { Category } from "@/features/categories/types";
import { categoryIdsInUse, subscriptionCategoryOptions } from "./categories";

const custom = (over: Partial<Category>): Category => ({
  id: "custom",
  name: "Własna",
  type: "expense",
  icon: "Ellipsis",
  color: "#64748b",
  isDefault: false,
  ...over,
});

/** Własna kategoria utworzona z formularza subskrypcji. */
const insurance = custom({ id: "c-insurance", name: "Ubezpieczenia", icon: "ShieldCheck", forSubscriptions: true });
/** Własne kategorie z Transakcji (bez flagi): jednorazowe wydatki. */
const coffee = custom({ id: "c-coffee", name: "Kawiarnie", icon: "Coffee" });
const sport = custom({ id: "c-sport", name: "Sport", icon: "Dumbbell" });
/** Przychód z flagą (np. z ręcznie poprawionych danych) — nigdy nie trafia do subskrypcji. */
const tutoring = custom({ id: "c-tutoring", name: "Korepetycje", type: "income", forSubscriptions: true });

const all: readonly Category[] = [...DEFAULT_CATEGORIES, insurance, coffee, sport, tutoring];
const names = (list: readonly Category[]) => list.map((c) => c.name);

describe("subscriptionCategoryOptions", () => {
  it("z kategorii domyślnych zostawia tylko te od płatności cyklicznych", () => {
    expect(names(subscriptionCategoryOptions(DEFAULT_CATEGORIES))).toEqual([
      "Subskrypcje",
      "Transport",
      "Mieszkanie",
      "Rachunki",
      "Zdrowie",
      "Inne wydatki",
    ]);
  });

  it("pomija jednorazowe zakupy (jedzenie, zakupy, rozrywka, własne bez flagi) i przychody", () => {
    const list = names(subscriptionCategoryOptions(all));
    for (const name of ["Jedzenie", "Zakupy", "Rozrywka", "Kawiarnie", "Sport", "Wynagrodzenie", "Korepetycje"]) {
      expect(list).not.toContain(name);
    }
  });

  it("własna kategoria subskrypcji stoi po domyślnych, a przed „Inne wydatki”", () => {
    expect(names(subscriptionCategoryOptions(all))).toEqual([
      "Subskrypcje",
      "Transport",
      "Mieszkanie",
      "Rachunki",
      "Zdrowie",
      "Ubezpieczenia",
      "Inne wydatki",
    ]);
  });

  it("pokazuje kategorie, w których są już subskrypcje (np. „Sport” z karnetem)", () => {
    const list = names(
      subscriptionCategoryOptions(all, { usedIds: new Set([sport.id, "cat-expense-food"]) }),
    );
    expect(list).toContain("Sport");
    expect(list).toContain("Jedzenie");
    expect(list).not.toContain("Kawiarnie");
    expect(list.at(-1)).toBe("Inne wydatki");
  });

  it("wybrana kategoria zostaje widoczna, nawet jeśli nie jest kategorią subskrypcji", () => {
    expect(names(subscriptionCategoryOptions(all, { selectedId: coffee.id }))).toContain("Kawiarnie");
  });

  it("kategorii przychodów nie pokazuje nawet jako używanej lub wybranej", () => {
    const list = subscriptionCategoryOptions(all, {
      usedIds: new Set([tutoring.id]),
      selectedId: "cat-income-salary",
    });
    expect(list.every((c) => c.type === "expense")).toBe(true);
  });

  it("„Subskrypcje” (wartość domyślna) zawsze pierwsze, „Inne wydatki” zawsze ostatnie", () => {
    const list = subscriptionCategoryOptions([...all].reverse());
    expect(list[0].id).toBe(SUBSCRIPTIONS_CATEGORY_ID);
    expect(list.at(-1)?.id).toBe(FALLBACK_CATEGORY_ID.expense);
  });

  it("nie zmienia przekazanej tablicy", () => {
    const input = [...all];
    subscriptionCategoryOptions(input);
    expect(input).toEqual(all);
  });
});

describe("categoryIdsInUse", () => {
  it("zbiera id kategorii używanych przez subskrypcje (bez powtórzeń)", () => {
    const ids = categoryIdsInUse([{ categoryId: "a" }, { categoryId: "b" }, { categoryId: "a" }]);
    expect([...ids].sort()).toEqual(["a", "b"]);
    expect(categoryIdsInUse([]).size).toBe(0);
  });
});
