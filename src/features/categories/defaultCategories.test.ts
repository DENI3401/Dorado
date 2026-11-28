import { describe, expect, it } from "vitest";
import {
  CATEGORY_ICONS,
  DEFAULT_CATEGORIES,
  FALLBACK_CATEGORY_ID,
  SUBSCRIPTIONS_CATEGORY_ID,
  isSelectableCategory,
  isSubscriptionCategory,
} from "./defaultCategories";

describe("isSelectableCategory", () => {
  it("ukrywa systemową kategorię „Subskrypcje” (nadaje ją tylko zakładka Subskrypcje)", () => {
    expect(isSelectableCategory({ id: SUBSCRIPTIONS_CATEGORY_ID })).toBe(false);
  });

  it("zostawia do wyboru pozostałe kategorie domyślne i własne", () => {
    const selectable = DEFAULT_CATEGORIES.filter(isSelectableCategory).map((c) => c.name);
    expect(selectable).not.toContain("Subskrypcje");
    expect(selectable).toContain("Inne wydatki");
    expect(selectable).toContain("Wynagrodzenie");
    expect(isSelectableCategory({ id: "custom-uuid" })).toBe(true);
  });

  it("kategoria „Subskrypcje” nadal istnieje w danych (płatności subskrypcji i wykresy)", () => {
    expect(DEFAULT_CATEGORIES.some((c) => c.id === SUBSCRIPTIONS_CATEGORY_ID)).toBe(true);
  });
});

describe("isSubscriptionCategory", () => {
  const subscriptionNames = DEFAULT_CATEGORIES.filter(isSubscriptionCategory).map((c) => c.name);

  it("z domyślnych to kategorie stałych opłat", () => {
    expect(subscriptionNames).toEqual([
      "Transport",
      "Mieszkanie",
      "Rachunki",
      "Zdrowie",
      "Subskrypcje",
      "Inne wydatki",
    ]);
  });

  it("jednorazowe zakupy i przychody nie są kategoriami subskrypcji", () => {
    for (const name of ["Jedzenie", "Zakupy", "Rozrywka", "Wynagrodzenie", "Premia"]) {
      expect(subscriptionNames).not.toContain(name);
    }
  });

  it("obejmuje „Subskrypcje” (domyślna wartość formularza) i „Inne wydatki” (zapas po usunięciu kategorii)", () => {
    const ids = DEFAULT_CATEGORIES.filter(isSubscriptionCategory).map((c) => c.id);
    expect(ids).toContain(SUBSCRIPTIONS_CATEGORY_ID);
    expect(ids).toContain(FALLBACK_CATEGORY_ID.expense);
  });

  it("własna kategoria: tylko wydatek z flagą forSubscriptions === true", () => {
    expect(isSubscriptionCategory({ type: "expense", forSubscriptions: true })).toBe(true);
    expect(isSubscriptionCategory({ type: "expense", forSubscriptions: false })).toBe(false);
    expect(isSubscriptionCategory({ type: "expense" })).toBe(false);
    expect(isSubscriptionCategory({ type: "income", forSubscriptions: true })).toBe(false);
  });
});

describe("CATEGORY_ICONS", () => {
  it("zawiera ikony typowych płatności cyklicznych i nie ma powtórzeń", () => {
    for (const icon of ["ShieldCheck", "Wifi", "Zap", "Tv", "Cloud", "Bus"]) {
      expect(CATEGORY_ICONS).toContain(icon);
    }
    expect(new Set(CATEGORY_ICONS).size).toBe(CATEGORY_ICONS.length);
  });

  it("ikony kategorii domyślnych są na liście kreatora", () => {
    for (const c of DEFAULT_CATEGORIES) {
      expect(CATEGORY_ICONS as readonly string[]).toContain(c.icon);
    }
  });
});
