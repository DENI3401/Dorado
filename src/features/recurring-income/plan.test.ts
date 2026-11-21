import { describe, expect, it } from "vitest";
import type { Transaction } from "@/features/transactions/types";
import { planRecurringIncome } from "./plan";
import type { RecurringIncome } from "./types";

function rule(over: Partial<RecurringIncome> = {}): RecurringIncome {
  return {
    id: "r1",
    amount: 6500,
    categoryId: "cat-income-salary",
    period: "monthly",
    startDate: "2026-09-10",
    endDate: null,
    isActive: true,
    note: "Pensja",
    createdAt: "2026-09-01T00:00:00.000Z",
    generatedThrough: null,
    ...over,
  };
}

function tx(recurringIncomeId: string, date: string): Transaction {
  return {
    id: `t-${recurringIncomeId}-${date}`,
    type: "income",
    incomeKind: "salary",
    amount: 6500,
    categoryId: "cat-income-salary",
    date,
    note: "Pensja",
    createdAt: "2026-09-01T00:00:00.000Z",
    recurringIncomeId,
  };
}

const dates = (created: Transaction[]) => created.map((t) => t.date);

describe("planRecurringIncome", () => {
  it("przy pierwszym uruchomieniu księguje wpływy od startDate do dziś (włącznie)", () => {
    const plan = planRecurringIncome([rule()], [], "2026-11-10");
    expect(dates(plan.created)).toEqual(["2026-09-10", "2026-10-10", "2026-11-10"]);
    expect(plan.created[0]).toMatchObject({
      type: "income",
      incomeKind: "salary",
      amount: 6500,
      categoryId: "cat-income-salary",
      note: "Pensja",
      recurringIncomeId: "r1",
    });
    expect(plan.generatedThrough).toEqual({ r1: "2026-11-10" });
  });

  it("nie księguje wpływów z przyszłości", () => {
    const plan = planRecurringIncome([rule()], [], "2026-11-09");
    expect(dates(plan.created)).toEqual(["2026-09-10", "2026-10-10"]);
  });

  it("pensja pojawia się w każdym cyklu: po miesiącu dopisuje tylko nowy wpływ", () => {
    const first = planRecurringIncome([rule()], [], "2026-11-10");
    const synced = rule({ generatedThrough: first.generatedThrough.r1 });

    const sameDay = planRecurringIncome([synced], first.created, "2026-11-10");
    expect(sameDay.created).toHaveLength(0);

    const nextMonth = planRecurringIncome([synced], first.created, "2026-12-12");
    expect(dates(nextMonth.created)).toEqual(["2026-12-10"]);
    expect(nextMonth.generatedThrough).toEqual({ r1: "2026-12-12" });
  });

  it("jest idempotentna: ponowne uruchomienie po zastosowaniu planu nic nie dopisuje", () => {
    const first = planRecurringIncome([rule()], [], "2026-11-15");
    const synced = rule({ generatedThrough: first.generatedThrough.r1 });
    expect(planRecurringIncome([synced], first.created, "2026-11-15").created).toHaveLength(0);
  });

  it("ręcznie usunięty wpływ nie wraca (chroni go „rozliczone do”)", () => {
    const synced = rule({ generatedThrough: "2026-11-15" });
    const withoutOctober = [tx("r1", "2026-09-10"), tx("r1", "2026-11-10")];
    expect(planRecurringIncome([synced], withoutOctober, "2026-11-20").created).toHaveLength(0);
  });

  it("nie tworzy drugiej transakcji, gdy para (wynagrodzenie, data) już istnieje", () => {
    const plan = planRecurringIncome([rule()], [tx("r1", "2026-10-10")], "2026-11-10");
    expect(dates(plan.created)).toEqual(["2026-09-10", "2026-11-10"]);
  });

  it("wstrzymane nic nie tworzy, ale przesuwa „rozliczone do” — po wznowieniu bez wpływów z pauzy", () => {
    const paused = rule({ isActive: false, generatedThrough: "2026-10-10" });
    const during = planRecurringIncome([paused], [], "2026-12-20");
    expect(during.created).toHaveLength(0);
    expect(during.generatedThrough).toEqual({ r1: "2026-12-20" });

    const resumed = rule({ generatedThrough: during.generatedThrough.r1 });
    expect(planRecurringIncome([resumed], [], "2027-01-12").created.map((t) => t.date)).toEqual([
      "2027-01-10",
    ]);
  });

  it("startDate w przyszłości: nic teraz, a gdy termin nadejdzie — dokładnie jeden wpływ", () => {
    const future = rule({ startDate: "2026-12-10" });
    const now = planRecurringIncome([future], [], "2026-11-15");
    expect(now.created).toHaveLength(0);

    const later = planRecurringIncome(
      [rule({ startDate: "2026-12-10", generatedThrough: now.generatedThrough.r1 })],
      [],
      "2026-12-10",
    );
    expect(dates(later.created)).toEqual(["2026-12-10"]);
  });

  it("dzień 31. w krótszym miesiącu przypada na ostatni dzień miesiąca", () => {
    const plan = planRecurringIncome([rule({ startDate: "2026-01-31" })], [], "2026-03-31");
    expect(dates(plan.created)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
  });

  it("uwzględnia endDate (włącznie)", () => {
    const plan = planRecurringIncome([rule({ endDate: "2026-10-10" })], [], "2026-12-31");
    expect(dates(plan.created)).toEqual(["2026-09-10", "2026-10-10"]);
  });

  it("obsługuje kilka wynagrodzeń niezależnie", () => {
    const a = rule({ id: "a", startDate: "2026-11-01" });
    const b = rule({ id: "b", startDate: "2026-11-05", amount: 1200, note: "Etat 2" });
    const plan = planRecurringIncome([a, b], [], "2026-11-06");
    expect(plan.created.map((t) => `${t.recurringIncomeId}:${t.date}`)).toEqual([
      "a:2026-11-01",
      "b:2026-11-05",
    ]);
    expect(plan.generatedThrough).toEqual({ a: "2026-11-06", b: "2026-11-06" });
  });

  it("nie cofa „rozliczone do” (np. po cofnięciu zegara systemowego)", () => {
    const plan = planRecurringIncome([rule({ generatedThrough: "2026-12-01" })], [], "2026-11-20");
    expect(plan.generatedThrough).toEqual({ r1: "2026-12-01" });
    expect(plan.created).toHaveLength(0);
  });

  it("nadaje każdej transakcji unikalne id i podany znacznik createdAt", () => {
    const now = new Date("2026-11-10T08:00:00.000Z");
    const plan = planRecurringIncome([rule()], [], "2026-11-10", now);
    expect(new Set(plan.created.map((t) => t.id)).size).toBe(3);
    expect(plan.created.every((t) => t.createdAt === now.toISOString())).toBe(true);
  });
});
