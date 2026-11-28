/**
 * Stan aplikacji tuż po pierwszym uruchomieniu z danymi demo — bez Reacta i bez magazynów.
 *
 * Odtwarza to, co robi AppLayout zaraz po wczytaniu demo: najpierw księguje płatności
 * subskrypcji (F4), potem wpływy wynagrodzeń (F9) — tymi samymi funkcjami co aplikacja.
 * Przydaje się w testach (F16): daje realistyczny, powtarzalny zestaw danych dla dowolnej daty.
 */
import { planRecurringIncome } from "@/features/recurring-income/plan";
import { planSubscriptionPayments, type SyncedThrough } from "@/lib/planSubscriptionPayments";
import { buildDemoData, type DemoCollections } from "./build";
import { getDemoFile } from "./demoFile";
import type { DemoFile } from "./schema";

export interface DemoLaunchState extends DemoCollections {
  /** Znacznik „płatności przetworzone do” po pierwszej synchronizacji subskrypcji. */
  subscriptionSync: SyncedThrough;
}

export function simulateFirstLaunch(
  todayIso: string,
  file: DemoFile = getDemoFile(),
  now: Date = new Date(),
): DemoLaunchState {
  const demo = buildDemoData(file, todayIso);

  const payments = planSubscriptionPayments(demo.subscriptions, demo.transactions, {}, todayIso, now);
  const withPayments = [...payments.created, ...demo.transactions];

  const salary = planRecurringIncome(demo.recurringIncomes, withPayments, todayIso, now);
  const recurringIncomes = demo.recurringIncomes.map((r) => ({
    ...r,
    generatedThrough: salary.generatedThrough[r.id] ?? r.generatedThrough,
  }));

  return {
    ...demo,
    transactions: [...salary.created, ...withPayments],
    recurringIncomes,
    subscriptionSync: payments.syncedThrough,
  };
}
