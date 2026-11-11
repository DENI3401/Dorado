import { describe, expect, it } from "vitest";
import type { Transaction } from "@/features/transactions/types";
import {
  addDaysIso,
  buildPayments,
  clampDay,
  getOccurrences,
  getSubscriptionStatus,
  monthlyCost,
  nextOccurrence,
  sortSubscriptions,
  sumMonthlyCost,
  sumYearlyCost,
  yearlyCost,
} from "./schedule";
import type { Subscription } from "./types";

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: "s1",
  name: "Netflix",
  amount: 50,
  categoryId: "cat-expense-subscriptions",
  period: "monthly",
  startDate: "2026-01-15",
  endDate: null,
  isActive: true,
  note: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("clampDay", () => {
  it("ogranicza dzień długością miesiąca", () => {
    expect(clampDay(2026, 4, 31)).toBe(30);
    expect(clampDay(2026, 2, 31)).toBe(28);
    expect(clampDay(2028, 2, 31)).toBe(29);
    expect(clampDay(2026, 1, 31)).toBe(31);
  });
});

describe("addDaysIso", () => {
  it("przechodzi przez granice miesięcy i lat", () => {
    expect(addDaysIso("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysIso("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDaysIso("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("getOccurrences — miesięczne", () => {
  it("zwraca jedną płatność na miesiąc w tym samym dniu", () => {
    expect(getOccurrences(sub(), "2026-02-01", "2026-04-30")).toEqual([
      "2026-02-15",
      "2026-03-15",
      "2026-04-15",
    ]);
  });

  it("31. w krótkim miesiącu idzie w ostatni dzień, a potem znów 31.", () => {
    const s = sub({ startDate: "2026-01-31" });
    expect(getOccurrences(s, "2026-01-01", "2026-05-31")).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
    ]);
  });

  it("w roku przestępnym luty ma 29. dzień", () => {
    const s = sub({ startDate: "2028-01-31" });
    expect(getOccurrences(s, "2028-02-01", "2028-02-29")).toEqual(["2028-02-29"]);
  });

  it("przed startDate nie ma płatności (start w przyszłości)", () => {
    const s = sub({ startDate: "2026-06-10" });
    expect(getOccurrences(s, "2026-01-01", "2026-06-09")).toEqual([]);
    expect(getOccurrences(s, "2026-01-01", "2026-07-31")).toEqual(["2026-06-10", "2026-07-10"]);
  });

  it("endDate jest włącznie", () => {
    const s = sub({ endDate: "2026-03-15" });
    expect(getOccurrences(s, "2026-01-01", "2026-12-31")).toEqual([
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
    ]);
    const s2 = sub({ endDate: "2026-03-14" });
    expect(getOccurrences(s2, "2026-01-01", "2026-12-31")).toEqual(["2026-01-15", "2026-02-15"]);
  });

  it("granice przedziału są włącznie", () => {
    expect(getOccurrences(sub(), "2026-02-15", "2026-02-15")).toEqual(["2026-02-15"]);
    expect(getOccurrences(sub(), "2026-02-16", "2026-03-14")).toEqual([]);
  });

  it("wstrzymana subskrypcja daje pusty wynik", () => {
    expect(getOccurrences(sub({ isActive: false }), "2026-01-01", "2026-12-31")).toEqual([]);
  });

  it("przedział odwrócony lub niepoprawna data dają pusty wynik", () => {
    expect(getOccurrences(sub(), "2026-05-01", "2026-04-01")).toEqual([]);
    expect(getOccurrences(sub(), "2026-02-31", "2026-04-01")).toEqual([]);
  });
});

describe("getOccurrences — roczne", () => {
  it("raz w roku w tym samym dniu", () => {
    const s = sub({ period: "yearly", startDate: "2024-03-10" });
    expect(getOccurrences(s, "2025-01-01", "2027-12-31")).toEqual([
      "2025-03-10",
      "2026-03-10",
      "2027-03-10",
    ]);
  });

  it("29 lutego w roku nieprzestępnym idzie na 28 lutego", () => {
    const s = sub({ period: "yearly", startDate: "2024-02-29" });
    expect(getOccurrences(s, "2024-01-01", "2029-12-31")).toEqual([
      "2024-02-29",
      "2025-02-28",
      "2026-02-28",
      "2027-02-28",
      "2028-02-29",
      "2029-02-28",
    ]);
  });
});

describe("nextOccurrence", () => {
  it("zwraca pierwszą płatność ściśle po podanej dacie", () => {
    expect(nextOccurrence(sub(), "2026-02-14")).toBe("2026-02-15");
    expect(nextOccurrence(sub(), "2026-02-15")).toBe("2026-03-15");
  });

  it("przed startem zwraca datę startu", () => {
    expect(nextOccurrence(sub({ startDate: "2027-01-01" }), "2026-06-01")).toBe("2027-01-01");
  });

  it("zwraca null po zakończeniu i dla wstrzymanej", () => {
    expect(nextOccurrence(sub({ endDate: "2026-03-15" }), "2026-03-15")).toBeNull();
    expect(nextOccurrence(sub({ isActive: false }), "2026-01-01")).toBeNull();
  });

  it("działa dla rocznej (kolejna za ~rok)", () => {
    const s = sub({ period: "yearly", startDate: "2024-02-29" });
    expect(nextOccurrence(s, "2026-02-28")).toBe("2027-02-28");
  });
});

describe("koszty", () => {
  it("przelicza miesięczne i roczne", () => {
    expect(monthlyCost(sub({ amount: 49.99 }))).toBe(49.99);
    expect(yearlyCost(sub({ amount: 49.99 }))).toBe(599.88);
    expect(monthlyCost(sub({ period: "yearly", amount: 100 }))).toBe(8.33);
    expect(yearlyCost(sub({ period: "yearly", amount: 100 }))).toBe(100);
  });

  it("sumuje bez kumulowania błędów zaokrągleń", () => {
    const three = [1, 2, 3].map((i) => sub({ id: `y${i}`, period: "yearly", amount: 100 }));
    expect(sumMonthlyCost(three)).toBe(25);
    expect(sumYearlyCost([...three, sub({ amount: 10 })])).toBe(420);
  });
});

describe("status i sortowanie", () => {
  const today = "2026-05-10";
  it("rozpoznaje status", () => {
    expect(getSubscriptionStatus(sub(), today)).toBe("active");
    expect(getSubscriptionStatus(sub({ isActive: false }), today)).toBe("paused");
    expect(getSubscriptionStatus(sub({ endDate: "2026-05-09" }), today)).toBe("ended");
    expect(getSubscriptionStatus(sub({ endDate: "2026-05-10" }), today)).toBe("active");
  });

  it("sortuje: aktywne po najbliższej płatności, potem zakończone, wstrzymane na końcu", () => {
    const list = [
      sub({ id: "paused", name: "A", isActive: false }),
      sub({ id: "later", name: "B", startDate: "2026-01-25" }),
      sub({ id: "ended", name: "C", endDate: "2026-04-01" }),
      sub({ id: "soon", name: "D", startDate: "2026-01-12" }),
    ];
    expect(sortSubscriptions(list, today).map((s) => s.id)).toEqual([
      "soon",
      "later",
      "ended",
      "paused",
    ]);
  });
});

describe("buildPayments", () => {
  const tx = (over: Partial<Transaction>): Transaction => ({
    id: crypto.randomUUID(),
    type: "expense",
    incomeKind: null,
    amount: 50,
    categoryId: "cat-expense-subscriptions",
    date: "2026-02-15",
    note: "",
    createdAt: "2026-02-15T00:00:00.000Z",
    ...over,
  });

  it("zwraca posortowane płatności z flagą paid, grupowaniem po dacie i sumą", () => {
    const a = sub({ id: "a", name: "Spotify", amount: 20 });
    const b = sub({ id: "b", name: "Netflix", amount: 50 });
    const paused = sub({ id: "c", name: "Zzz", isActive: false });
    const r = buildPayments([a, b, paused], [tx({ subscriptionId: "b", date: "2026-02-15" })], "2026-02-01", "2026-03-31");

    expect(r.occurrences.map((o) => `${o.date} ${o.subscription.name} ${o.paid}`)).toEqual([
      "2026-02-15 Netflix true",
      "2026-02-15 Spotify false",
      "2026-03-15 Netflix false",
      "2026-03-15 Spotify false",
    ]);
    expect(Object.keys(r.byDate)).toEqual(["2026-02-15", "2026-03-15"]);
    expect(r.total).toBe(140);
  });

  it("transakcja z tą samą datą, ale innej subskrypcji nie oznacza płatności", () => {
    const r = buildPayments([sub()], [tx({ subscriptionId: "other" }), tx({})], "2026-02-01", "2026-02-28");
    expect(r.occurrences[0].paid).toBe(false);
  });
});
