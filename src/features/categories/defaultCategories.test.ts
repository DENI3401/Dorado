import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORIES,
  SUBSCRIPTIONS_CATEGORY_ID,
  isSelectableCategory,
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
