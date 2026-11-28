import { describe, expect, it } from "vitest";
import { isBelowThreshold } from "@/features/alerts/lowBalance";
import { lowBalanceMessage } from "@/features/alerts/messages";
import { backupDataSchema } from "@/features/backup/schema";
import { getCycleBalance, getCycleRange } from "@/features/budget-cycle";
import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";
import { aggregateByCategory, transactionsInRange } from "@/features/dashboard/aggregate";
import { calculateSafeToSpend, getUpcomingPayments } from "@/features/dashboard/safeToSpend";
import { planRecurringIncome } from "@/features/recurring-income/plan";
import { DEFAULT_SETTINGS } from "@/features/settings/types";
import {
  addDaysIso,
  buildPayments,
  getSubscriptionStatus,
  nextOccurrence,
  sumMonthlyCost,
  sumYearlyCost,
} from "@/features/subscriptions/schedule";
import { planSubscriptionPayments } from "@/lib/planSubscriptionPayments";
import { simulateFirstLaunch } from "./simulate";

/**
 * Pierwsze uruchomienie z danymi demo — tak, jak widzi je użytkownik (po automatycznym
 * zaksięgowaniu pensji i płatności subskrypcji). Wartości kontrolne opisuje docs/dane-demo.md.
 */
const TODAY = "2026-11-28";

function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDaysIso(d, 1)) days.push(d);
  return days;
}

describe("wartości kontrolne dla 2026-11-28 (ustawienia domyślne: cykl od 1., próg 500 zł)", () => {
  const state = simulateFirstLaunch(TODAY);
  const cycle = getCycleRange(TODAY, DEFAULT_SETTINGS.cycleStartDay);
  const inCycle = transactionsInRange(state.transactions, cycle);
  const categories = [...DEFAULT_CATEGORIES, ...state.customCategories];

  it("113 operacji: 83 z pliku + 4 pensje + 26 płatności subskrypcji", () => {
    expect(state.transactions).toHaveLength(113);
    const generated = state.transactions.filter((t) => !t.id.startsWith("demo-"));
    expect(generated.filter((t) => t.recurringIncomeId === "demo-rec-salary")).toHaveLength(4);
    expect(generated.filter((t) => t.subscriptionId !== undefined)).toHaveLength(26);
    expect(state.transactions.filter((t) => t.type === "income")).toHaveLength(14);
  });

  it("bieżący cykl 01.11–30.11: saldo otwarcia, przychody, wydatki, saldo", () => {
    expect(cycle).toEqual({ start: "2026-11-01", end: "2026-11-30" });
    expect(getCycleBalance(state.transactions, cycle)).toEqual({
      opening: 6320.54,
      income: 5952,
      expense: 2899.33,
      balance: 9373.21,
    });
    expect(inCycle).toHaveLength(33);
    expect(inCycle.filter((t) => t.type === "income")).toHaveLength(4);
  });

  it("pensja: 4 wpływy w historii, następny 10.12", () => {
    const salary = state.recurringIncomes.find((r) => r.id === "demo-rec-salary");
    expect(salary && nextOccurrence(salary, addDaysIso(TODAY, -1))).toBe("2026-12-10");
    expect(
      state.transactions.filter((t) => t.recurringIncomeId === "demo-rec-salary").map((t) => t.date).sort(),
    ).toEqual(["2026-08-10", "2026-09-10", "2026-10-10", "2026-11-10"]);
  });

  it("Safe-to-Spend: czynsz 30.11 to jedyna nadchodząca płatność", () => {
    const upcoming = getUpcomingPayments(state.subscriptions, state.transactions, TODAY, cycle.end);
    expect(upcoming.occurrences.map((o) => [o.date, o.subscription.name])).toEqual([
      ["2026-11-30", "Czynsz za mieszkanie"],
    ]);
    expect(
      calculateSafeToSpend({ balance: 9373.21, upcomingTotal: upcoming.total, todayIso: TODAY, cycleEndIso: cycle.end }),
    ).toEqual({ perDay: 2491.07, available: 7473.21, daysLeft: 3, isShortfall: false });
  });

  it("wykresy kategorii: 9 kategorii wydatków i 4 przychodów", () => {
    const expense = aggregateByCategory(inCycle, cycle, categories, "expense");
    const income = aggregateByCategory(inCycle, cycle, categories, "income");
    expect(expense.map((s) => s.name)).toEqual([
      "Jedzenie",
      "Transport",
      "Rachunki",
      "Zdrowie",
      "Sport",
      "Zakupy",
      "Rozrywka",
      "Kawiarnie",
      "Subskrypcje",
    ]);
    expect(expense[0].amount).toBe(937.4);
    expect((expense[0].share * 100).toFixed(1)).toBe("32.3");
    expect((income[0].share * 100).toFixed(1)).toBe("87.4");
    expect(income.map((s) => [s.name, s.amount])).toEqual([
      ["Wynagrodzenie", 5200],
      ["Freelance", 600],
      ["Sprzedaż online", 120],
      ["Inne przychody", 32],
    ]);
  });

  it("subskrypcje: 7 aktywnych, 1 zakończona, 1 wstrzymana; sumy aktywnych", () => {
    const statuses = state.subscriptions.map((s) => getSubscriptionStatus(s, TODAY));
    expect(statuses.filter((s) => s === "active")).toHaveLength(7);
    expect(statuses.filter((s) => s === "ended")).toHaveLength(1);
    expect(statuses.filter((s) => s === "paused")).toHaveLength(1);
    const active = state.subscriptions.filter((s) => getSubscriptionStatus(s, TODAY) === "active");
    expect(sumMonthlyCost(active)).toBe(2263.4);
    expect(sumYearlyCost(active)).toBe(27160.76);
  });

  it("kalendarz: czynsz 30.11 (miesiąc 30-dniowy), grudzień z płatnością roczną", () => {
    const november = buildPayments(state.subscriptions, state.transactions, "2026-11-01", "2026-11-30");
    expect(november.occurrences.filter((o) => !o.paid).map((o) => o.date)).toEqual(["2026-11-30"]);
    expect(november.total).toBe(2230.98);
    const paid = november.occurrences.filter((o) => o.paid).reduce((sum, o) => sum + o.amount, 0);
    expect(Math.round(paid * 100) / 100).toBe(330.98);
    const december = buildPayments(state.subscriptions, state.transactions, "2026-12-01", "2026-12-31");
    expect(december.occurrences).toHaveLength(7);
    expect(december.total).toBe(2619.98);
    expect(december.occurrences.find((o) => o.subscription.period === "yearly")?.date).toBe("2026-12-20");
    const february = buildPayments(state.subscriptions, state.transactions, "2027-02-01", "2027-02-28");
    expect(february.occurrences.find((o) => o.subscriptionId === "demo-sub-rent")?.date).toBe("2027-02-28");
  });

  it("alert niskiego salda się nie włącza, ale próg 10 000 zł już go uruchamia", () => {
    expect(isBelowThreshold(9373.21, DEFAULT_SETTINGS.lowBalanceThreshold)).toBe(false);
    expect(isBelowThreshold(9373.21, 10_000)).toBe(true);
    expect(lowBalanceMessage(2899.33, 9373.21).replace(/\s/g, " ")).toBe(
      "Wydałeś już 2899,33 zł. Na Twoim koncie pozostało tylko 9373,21 zł",
    );
  });

  it("cykl od dnia wypłaty (10.): 10.11–09.12, trzy nadchodzące płatności", () => {
    const payday = getCycleRange(TODAY, 10);
    expect(payday).toEqual({ start: "2026-11-10", end: "2026-12-09" });
    expect(getCycleBalance(state.transactions, payday)).toEqual({
      opening: 5183.92,
      income: 5952,
      expense: 1762.71,
      balance: 9373.21,
    });
    const upcoming = getUpcomingPayments(state.subscriptions, state.transactions, TODAY, payday.end);
    expect(upcoming.occurrences.map((o) => o.date)).toEqual(["2026-11-30", "2026-12-01", "2026-12-05"]);
    expect(upcoming.total).toBe(2082);
    expect(
      calculateSafeToSpend({ balance: 9373.21, upcomingTotal: 2082, todayIso: TODAY, cycleEndIso: payday.end }),
    ).toEqual({ perDay: 607.6, available: 7291.21, daysLeft: 12, isShortfall: false });
  });
});

describe("pierwsze uruchomienie w dowolnym dniu 2026–2028", () => {
  const days = eachDay("2026-01-01", "2028-12-31");

  it("dane po synchronizacji są poprawne (F14) i bieżący cykl nigdy nie jest pusty", () => {
    const failures: string[] = [];
    for (const day of days) {
      const state = simulateFirstLaunch(day);
      const valid = backupDataSchema.safeParse({
        ...state,
        settings: DEFAULT_SETTINGS,
        alerts: { lowBalanceAlertTriggered: false, alertCycleStart: null },
      });
      if (!valid.success) failures.push(`${day}: ${valid.error.issues[0].message}`);
      for (const startDay of [1, 10, 31]) {
        const cycle = getCycleRange(day, startDay);
        if (transactionsInRange(state.transactions, cycle).length === 0) failures.push(`${day}: pusty cykl ${startDay}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("saldo zawsze powyżej progu 500 zł, a Safe-to-Spend bez niedoboru (cykl od 1. i od 10.)", () => {
    const failures: string[] = [];
    for (const day of days) {
      const state = simulateFirstLaunch(day);
      for (const startDay of [1, 10]) {
        const cycle = getCycleRange(day, startDay);
        const { balance } = getCycleBalance(state.transactions, cycle);
        const upcoming = getUpcomingPayments(state.subscriptions, state.transactions, day, cycle.end);
        const safe = calculateSafeToSpend({ balance, upcomingTotal: upcoming.total, todayIso: day, cycleEndIso: cycle.end });
        if (isBelowThreshold(balance, DEFAULT_SETTINGS.lowBalanceThreshold)) failures.push(`${day}/${startDay}: alert`);
        if (safe.isShortfall) failures.push(`${day}/${startDay}: niedobór ${safe.available}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("ponowna synchronizacja niczego nie dubluje", () => {
    for (const day of ["2026-11-28", "2027-02-28", "2028-02-29", "2026-12-31"]) {
      const state = simulateFirstLaunch(day);
      expect(planSubscriptionPayments(state.subscriptions, state.transactions, state.subscriptionSync, day).created).toEqual([]);
      expect(planRecurringIncome(state.recurringIncomes, state.transactions, day).created).toEqual([]);
    }
  });

  it("czynsz „na 31.” w lutym przestępnym przypada 29.02, a w nieprzestępnym 28.02", () => {
    const rentDates = (day: string) =>
      simulateFirstLaunch(day)
        .transactions.filter((t) => t.subscriptionId === "demo-sub-rent")
        .map((t) => t.date);
    expect(rentDates("2028-03-15")).toContain("2028-02-29");
    expect(rentDates("2027-03-15")).toContain("2027-02-28");
  });
});
