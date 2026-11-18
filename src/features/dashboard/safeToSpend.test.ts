import { describe, expect, it } from "vitest";
import type { Subscription } from "@/features/subscriptions/types";
import type { Transaction } from "@/features/transactions/types";
import { calculateSafeToSpend, countDaysLeft, getUpcomingPayments } from "./safeToSpend";

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: "s1",
  name: "Netflix",
  amount: 50,
  categoryId: "cat-expense-subscriptions",
  period: "monthly",
  startDate: "2026-01-20",
  endDate: null,
  isActive: true,
  note: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const paid = (subscriptionId: string, date: string, amount = 50): Transaction => ({
  id: `p-${subscriptionId}-${date}`,
  type: "expense",
  incomeKind: null,
  amount,
  categoryId: "cat-expense-subscriptions",
  date,
  note: "",
  createdAt: `${date}T00:00:00.000Z`,
  subscriptionId,
});

describe("countDaysLeft", () => {
  it("liczy dni do końca cyklu razem z dzisiejszym", () => {
    expect(countDaysLeft("2026-11-17", "2026-11-30")).toBe(14);
    expect(countDaysLeft("2026-11-01", "2026-11-30")).toBe(30);
  });
  it("ostatni dzień cyklu = 1 dzień", () => {
    expect(countDaysLeft("2026-11-30", "2026-11-30")).toBe(1);
  });
  it("nigdy mniej niż 1 (dziś już po końcu cyklu)", () => {
    expect(countDaysLeft("2026-12-02", "2026-11-30")).toBe(1);
  });
  it("przełom roku i lutego przestępnego", () => {
    expect(countDaysLeft("2026-12-31", "2027-01-14")).toBe(15);
    expect(countDaysLeft("2028-02-28", "2028-02-29")).toBe(2);
  });
});

describe("getUpcomingPayments", () => {
  it("brak subskrypcji → 0", () => {
    expect(getUpcomingPayments([], [], "2026-11-17", "2026-11-30")).toEqual({ occurrences: [], total: 0 });
  });

  it("bierze płatności od dziś (włącznie) do końca cyklu", () => {
    const subs = [
      sub({ id: "a", startDate: "2026-01-20", amount: 50 }),
      sub({ id: "b", startDate: "2026-01-17", amount: 19.99 }), // dziś
      sub({ id: "c", startDate: "2026-01-05", amount: 100 }), // już minęła w tym cyklu
    ];
    const result = getUpcomingPayments(subs, [], "2026-11-17", "2026-11-30");
    expect(result.occurrences.map((o) => [o.subscriptionId, o.date])).toEqual([
      ["b", "2026-11-17"],
      ["a", "2026-11-20"],
    ]);
    expect(result.total).toBe(69.99);
  });

  it("pomija płatności już opłacone (jest transakcja z subscriptionId i datą)", () => {
    const subs = [sub({ id: "a", startDate: "2026-01-17" })];
    const result = getUpcomingPayments(subs, [paid("a", "2026-11-17")], "2026-11-17", "2026-11-30");
    expect(result.total).toBe(0);
  });

  it("pomija wstrzymane i zakończone subskrypcje", () => {
    const subs = [
      sub({ id: "a", isActive: false }),
      sub({ id: "b", endDate: "2026-11-10" }),
    ];
    expect(getUpcomingPayments(subs, [], "2026-11-17", "2026-11-30").total).toBe(0);
  });

  it("dzień 31 w krótszym miesiącu → ostatni dzień cyklu", () => {
    const subs = [sub({ startDate: "2026-01-31" })];
    const result = getUpcomingPayments(subs, [], "2026-11-17", "2026-11-30");
    expect(result.occurrences.map((o) => o.date)).toEqual(["2026-11-30"]);
  });

  it("dziś po końcu cyklu → brak płatności, bez błędu", () => {
    expect(getUpcomingPayments([sub()], [], "2026-12-02", "2026-11-30").total).toBe(0);
  });
});

describe("calculateSafeToSpend", () => {
  const base = { todayIso: "2026-11-17", cycleEndIso: "2026-11-30" };

  it("(saldo − płatności) / pozostałe dni, zaokrąglone do 2 miejsc", () => {
    expect(calculateSafeToSpend({ ...base, balance: 1000, upcomingTotal: 69.99 })).toEqual({
      perDay: 66.43, // 930.01 / 14 = 66.4292…
      available: 930.01,
      daysLeft: 14,
      isShortfall: false,
    });
  });

  it("ostatni dzień cyklu: cała dostępna kwota na dziś", () => {
    const result = calculateSafeToSpend({
      balance: 250.5,
      upcomingTotal: 0,
      todayIso: "2026-11-30",
      cycleEndIso: "2026-11-30",
    });
    expect(result).toMatchObject({ perDay: 250.5, daysLeft: 1 });
  });

  it("brak transakcji i subskrypcji → 0 bez ostrzeżenia", () => {
    const result = calculateSafeToSpend({ ...base, balance: 0, upcomingTotal: 0 });
    expect(result).toEqual({ perDay: 0, available: 0, daysLeft: 14, isShortfall: false });
    expect(Object.is(result.perDay, -0)).toBe(false);
  });

  it("ujemne saldo → 0 i ostrzeżenie", () => {
    expect(calculateSafeToSpend({ ...base, balance: -120, upcomingTotal: 0 })).toEqual({
      perDay: 0,
      available: -120,
      daysLeft: 14,
      isShortfall: true,
    });
  });

  it("płatności większe niż saldo → 0 i ostrzeżenie", () => {
    const result = calculateSafeToSpend({ ...base, balance: 40, upcomingTotal: 50 });
    expect(result).toMatchObject({ perDay: 0, available: -10, isShortfall: true });
  });

  it("saldo równe płatnościom → 0 bez ostrzeżenia", () => {
    const result = calculateSafeToSpend({ ...base, balance: 50, upcomingTotal: 50 });
    expect(result).toMatchObject({ perDay: 0, isShortfall: false });
  });

  it("odporne na błędy float (0.1 + 0.2 − 0.3)", () => {
    const result = calculateSafeToSpend({ ...base, balance: 0.1 + 0.2, upcomingTotal: 0.3 });
    expect(result).toMatchObject({ perDay: 0, available: 0, isShortfall: false });
  });

  it("dziś po końcu cyklu → dzielimy przez 1, nie przez 0 ani liczbę ujemną", () => {
    const result = calculateSafeToSpend({
      balance: 100,
      upcomingTotal: 0,
      todayIso: "2026-12-02",
      cycleEndIso: "2026-11-30",
    });
    expect(result).toMatchObject({ perDay: 100, daysLeft: 1 });
  });
});
