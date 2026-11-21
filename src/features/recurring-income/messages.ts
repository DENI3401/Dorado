import { formatPLN } from "@/features/transactions/utils/money";
import type { RecurringIncome, RecurringIncomeStatus } from "./types";

export const RECURRING_INCOME_STATUS_LABELS: Record<RecurringIncomeStatus, string> = {
  active: "Aktywne",
  paused: "Wstrzymane",
};

/** Dzień miesiąca, w którym wpływa wynagrodzenie (z daty pierwszego wpływu). */
export function recurringDayOfMonth(recurringIncome: RecurringIncome): number {
  return Number(recurringIncome.startDate.slice(8, 10));
}

/** Np. „co miesiąc, 10. dnia”. */
export function formatRecurringSchedule(recurringIncome: RecurringIncome): string {
  return `co miesiąc, ${recurringDayOfMonth(recurringIncome)}. dnia`;
}

/** Gotowe teksty do Toastów i dialogów (UI tylko je wyświetla). */
export function recurringCreatedMessage(recurringIncome: RecurringIncome, booked: number): string {
  const base = `Dodano wynagrodzenie cykliczne ${formatPLN(recurringIncome.amount)} (${formatRecurringSchedule(recurringIncome)})`;
  return booked > 0 ? `${base}. Zaksięgowano wpływy: ${booked}` : base;
}

export function removedRecurringIncomeMessage(recurringIncome: RecurringIncome): string {
  return `Usunięto wynagrodzenie cykliczne ${formatPLN(recurringIncome.amount)}`;
}

export function confirmRemoveRecurringIncomeText(recurringIncome: RecurringIncome): string {
  return `Czy na pewno usunąć wynagrodzenie cykliczne ${formatPLN(recurringIncome.amount)} (${formatRecurringSchedule(recurringIncome)})? Dotychczas zaksięgowane wpływy pozostaną w historii transakcji.`;
}

export function pausedRecurringIncomeMessage(recurringIncome: RecurringIncome): string {
  return `Wstrzymano wynagrodzenie cykliczne ${formatPLN(recurringIncome.amount)}`;
}

export function resumedRecurringIncomeMessage(recurringIncome: RecurringIncome): string {
  return `Wznowiono wynagrodzenie cykliczne ${formatPLN(recurringIncome.amount)}`;
}
