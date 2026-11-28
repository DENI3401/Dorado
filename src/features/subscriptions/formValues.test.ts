import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES, SUBSCRIPTIONS_CATEGORY_ID } from "@/features/categories/defaultCategories";
import { subscriptionFormDefaults, subscriptionToFormInput } from "./formValues";
import { applyValues } from "./model";
import { makeSubscriptionFormSchema } from "./schema";
import type { Subscription } from "./types";

const existing: Subscription = {
  id: "s1",
  name: "Spotify Premium",
  amount: 23.99,
  categoryId: "cat-expense-subscriptions",
  period: "monthly",
  startDate: "2026-09-18",
  endDate: null,
  isActive: true,
  note: "Plan rodzinny",
  createdAt: "2026-09-18T08:00:00.000Z",
};

describe("subscriptionFormDefaults", () => {
  it("nowa subskrypcja: kategoria „Subskrypcje”, co miesiąc, pierwsza płatność dziś", () => {
    expect(subscriptionFormDefaults("2026-11-28")).toEqual({
      name: "",
      amount: "",
      categoryId: SUBSCRIPTIONS_CATEGORY_ID,
      period: "monthly",
      startDate: "2026-11-28",
      endDate: "",
      note: "",
    });
  });

  it("puste wartości nie przechodzą walidacji (trzeba podać nazwę i kwotę)", () => {
    const r = makeSubscriptionFormSchema(DEFAULT_CATEGORIES).safeParse(subscriptionFormDefaults("2026-11-28"));
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0]).sort()).toEqual(["amount", "name"]);
  });
});

describe("subscriptionToFormInput", () => {
  it("kwota jako tekst, brak końca jako pusty napis, kategoria bez zmian", () => {
    expect(subscriptionToFormInput(existing)).toEqual({
      name: "Spotify Premium",
      amount: "23.99",
      categoryId: "cat-expense-subscriptions",
      period: "monthly",
      startDate: "2026-09-18",
      endDate: "",
      note: "Plan rodzinny",
    });
    expect(subscriptionToFormInput({ ...existing, endDate: "2027-01-31" }).endDate).toBe("2027-01-31");
  });

  it("otwarcie edycji i zapis bez zmian nie zmienia subskrypcji", () => {
    const parsed = makeSubscriptionFormSchema(DEFAULT_CATEGORIES).parse(subscriptionToFormInput(existing));
    expect(applyValues(existing, parsed)).toEqual(existing);
  });
});
