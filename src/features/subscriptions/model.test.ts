import { describe, expect, it } from "vitest";
import { applyValues, createSubscription } from "./model";
import type { SubscriptionFormValues } from "./schema";
import type { Subscription } from "./types";

const values = (over: Partial<SubscriptionFormValues> = {}): SubscriptionFormValues => ({
  name: "OC samochodu",
  amount: 1240,
  categoryId: "c-insurance",
  period: "yearly",
  startDate: "2026-11-28",
  endDate: "",
  note: "Polisa PZU",
  ...over,
});

describe("createSubscription", () => {
  const now = new Date("2026-11-28T15:42:00.000Z");

  it("tworzy aktywną subskrypcję z wybraną kategorią", () => {
    const s = createSubscription(values(), now);
    expect(s).toMatchObject({
      name: "OC samochodu",
      amount: 1240,
      categoryId: "c-insurance",
      period: "yearly",
      startDate: "2026-11-28",
      endDate: null,
      isActive: true,
      note: "Polisa PZU",
      createdAt: "2026-11-28T15:42:00.000Z",
    });
  });

  it("pusty koniec = bezterminowo (null), podany koniec zostaje", () => {
    expect(createSubscription(values(), now).endDate).toBeNull();
    expect(createSubscription(values({ endDate: "2027-11-27" }), now).endDate).toBe("2027-11-27");
  });

  it("każda subskrypcja dostaje unikalne id", () => {
    const a = createSubscription(values(), now);
    const b = createSubscription(values(), now);
    expect(a.id).not.toBe(b.id);
    expect(a.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("applyValues", () => {
  const existing: Subscription = {
    id: "s1",
    name: "Netflix",
    amount: 43,
    categoryId: "cat-expense-subscriptions",
    period: "monthly",
    startDate: "2026-08-05",
    endDate: "2027-01-05",
    isActive: false,
    note: "",
    createdAt: "2026-08-01T10:00:00.000Z",
  };

  it("nadpisuje pola z formularza, w tym kategorię", () => {
    const updated = applyValues(existing, values({ name: "Netflix Premium", amount: 67, categoryId: "cat-expense-bills" }));
    expect(updated).toMatchObject({ name: "Netflix Premium", amount: 67, categoryId: "cat-expense-bills" });
  });

  it("zachowuje id, datę utworzenia i pauzę", () => {
    const updated = applyValues(existing, values());
    expect(updated.id).toBe("s1");
    expect(updated.createdAt).toBe(existing.createdAt);
    expect(updated.isActive).toBe(false);
  });

  it("wyczyszczony koniec zamienia się na null", () => {
    expect(applyValues(existing, values({ endDate: "" })).endDate).toBeNull();
  });

  it("nie zmienia przekazanego obiektu", () => {
    const copy = { ...existing };
    applyValues(existing, values());
    expect(existing).toEqual(copy);
  });
});
