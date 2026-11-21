/**
 * Wskaźnik Safe-to-Spend (czysta logika):
 *   (saldo cyklu − nieopłacone płatności subskrypcji do końca cyklu) / pozostałe dni
 * Dni liczymy razem z dzisiejszym, minimum 1. Wynik ujemny → 0 + flaga ostrzeżenia.
 */
import { daysBetween } from "@/components/subscriptions/nextPayment";
import { buildPayments } from "@/features/subscriptions/schedule";
import type { PaymentOccurrence, Subscription } from "@/features/subscriptions/types";
import type { Transaction } from "@/features/transactions/types";
import { roundMoney } from "@/features/transactions/utils/money";

/** Dni do końca cyklu łącznie z dzisiejszym; nigdy mniej niż 1 (np. po końcu cyklu). */
export function countDaysLeft(todayIso: string, cycleEndIso: string): number {
  return Math.max(1, daysBetween(todayIso, cycleEndIso) + 1);
}

export interface UpcomingPayments {
  occurrences: PaymentOccurrence[];
  total: number;
}

/**
 * Płatności subskrypcji od dziś (włącznie) do końca cyklu, które nie mają jeszcze
 * transakcji. Opłacone są już w saldzie, więc nie odejmujemy ich drugi raz.
 */
export function getUpcomingPayments(
  subscriptions: readonly Subscription[],
  transactions: readonly Transaction[],
  todayIso: string,
  cycleEndIso: string,
): UpcomingPayments {
  const occurrences = buildPayments(subscriptions, transactions, todayIso, cycleEndIso)
    .occurrences.filter((o) => !o.paid);
  return {
    occurrences,
    total: roundMoney(occurrences.reduce((sum, o) => sum + o.amount, 0)),
  };
}

export interface SafeToSpendInput {
  /** Saldo bieżącego cyklu (może być ujemne). */
  balance: number;
  /** Suma nieopłaconych płatności do końca cyklu. */
  upcomingTotal: number;
  todayIso: string;
  cycleEndIso: string;
}

export interface SafeToSpend {
  /** Kwota na dzień, ≥ 0, zaokrąglona do 2 miejsc. */
  perDay: number;
  /** Saldo po odjęciu nadchodzących płatności (może być ujemne). */
  available: number;
  daysLeft: number;
  /** true, gdy saldo nie pokrywa nadchodzących płatności (available < 0). */
  isShortfall: boolean;
}

export function calculateSafeToSpend({
  balance,
  upcomingTotal,
  todayIso,
  cycleEndIso,
}: SafeToSpendInput): SafeToSpend {
  const daysLeft = countDaysLeft(todayIso, cycleEndIso);
  const available = roundMoney(balance - upcomingTotal);
  if (available < 0) return { perDay: 0, available, daysLeft, isShortfall: true };
  // `+ 0` zamienia ewentualne -0 na 0, żeby formatPLN nie pokazał „-0,00 zł”.
  return { perDay: roundMoney(available / daysLeft) + 0, available: available + 0, daysLeft, isShortfall: false };
}
