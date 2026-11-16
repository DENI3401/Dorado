/**
 * Czysty harmonogram płatności subskrypcji (bez Reacta i bez magazynów).
 *
 * Wszystkie daty to napisy YYYY-MM-DD liczone na lokalnym kalendarzu —
 * bez stref czasowych i bez toISOString(). Miesiące w tym pliku są 1–12.
 */
import type { Transaction } from "@/features/transactions/types";
import { isValidIsoDate } from "@/features/transactions/utils/isoDate";
import { roundMoney } from "@/features/transactions/utils/money";
import type {
  PaymentOccurrence,
  Subscription,
  SubscriptionStatus,
} from "./types";

interface Ymd {
  y: number;
  m: number;
  d: number;
}

function parseIso(iso: string): Ymd {
  return {
    y: Number(iso.slice(0, 4)),
    m: Number(iso.slice(5, 7)),
    d: Number(iso.slice(8, 10)),
  };
}

function formatIso({ y, m, d }: Ymd): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Liczba dni w miesiącu (month: 1–12), z rokiem przestępnym. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Ogranicza dzień długością miesiąca: clampDay(2026, 2, 31) === 28. */
export function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/** Dodaje (lub odejmuje) dni do daty YYYY-MM-DD. */
export function addDaysIso(iso: string, days: number): string {
  const { y, m, d } = parseIso(iso);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return formatIso({
    y: date.getUTCFullYear(),
    m: date.getUTCMonth() + 1,
    d: date.getUTCDate(),
  });
}

/**
 * Daty płatności w przedziale [fromIso, toIso] (obie granice włącznie),
 * rosnąco. Subskrypcja wstrzymana (isActive: false) daje pustą listę.
 *
 * - monthly: dzień ze startDate; w krótszym miesiącu — ostatni dzień miesiąca.
 * - yearly: dzień i miesiąc ze startDate; 29 lutego w roku nieprzestępnym → 28 lutego.
 * - przed startDate płatności nie ma, endDate jest włącznie.
 */
export function getOccurrences(
  subscription: Subscription,
  fromIso: string,
  toIso: string,
): string[] {
  if (!subscription.isActive) return [];
  if (!isValidIsoDate(fromIso) || !isValidIsoDate(toIso)) return [];

  const lower = fromIso > subscription.startDate ? fromIso : subscription.startDate;
  const upper =
    subscription.endDate && subscription.endDate < toIso ? subscription.endDate : toIso;
  if (lower > upper) return [];

  const start = parseIso(subscription.startDate);
  const from = parseIso(lower);
  const to = parseIso(upper);
  const result: string[] = [];

  if (subscription.period === "monthly") {
    for (let y = from.y, m = from.m; y < to.y || (y === to.y && m <= to.m); ) {
      const date = formatIso({ y, m, d: clampDay(y, m, start.d) });
      if (date >= lower && date <= upper) result.push(date);
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  } else {
    for (let y = from.y; y <= to.y; y += 1) {
      const date = formatIso({ y, m: start.m, d: clampDay(y, start.m, start.d) });
      if (date >= lower && date <= upper) result.push(date);
    }
  }
  return result;
}

/**
 * Najbliższa płatność **ściśle po** dacie `afterIso` (żeby uwzględnić dzisiejszą,
 * podaj wczorajszą datę). Zwraca null, gdy subskrypcja jest wstrzymana lub zakończona.
 */
export function nextOccurrence(subscription: Subscription, afterIso: string): string | null {
  if (!subscription.isActive || !isValidIsoDate(afterIso)) return null;
  const next = addDaysIso(afterIso, 1);
  const from = next > subscription.startDate ? next : subscription.startDate;
  // Okres miesięczny: max ~31 dni do kolejnej płatności, roczny: max ~366.
  const horizon = addDaysIso(from, subscription.period === "monthly" ? 62 : 732);
  return getOccurrences(subscription, from, horizon)[0] ?? null;
}

/** Koszt przeliczony na miesiąc (roczne dzielimy przez 12). */
export function monthlyCost(subscription: Subscription): number {
  return subscription.period === "monthly"
    ? subscription.amount
    : roundMoney(subscription.amount / 12);
}

/** Koszt przeliczony na rok (miesięczne mnożymy przez 12). */
export function yearlyCost(subscription: Subscription): number {
  return subscription.period === "yearly"
    ? subscription.amount
    : roundMoney(subscription.amount * 12);
}

/** Suma miesięczna — zaokrąglana dopiero na końcu, żeby nie kumulować błędów. */
export function sumMonthlyCost(subscriptions: readonly Subscription[]): number {
  return roundMoney(
    subscriptions.reduce(
      (sum, s) => sum + (s.period === "monthly" ? s.amount : s.amount / 12),
      0,
    ),
  );
}

export function sumYearlyCost(subscriptions: readonly Subscription[]): number {
  return roundMoney(
    subscriptions.reduce(
      (sum, s) => sum + (s.period === "yearly" ? s.amount : s.amount * 12),
      0,
    ),
  );
}

/** Wstrzymana ma pierwszeństwo; „zakończona” = endDate już minęła. */
export function getSubscriptionStatus(
  subscription: Subscription,
  todayIso: string,
): SubscriptionStatus {
  if (!subscription.isActive) return "paused";
  if (subscription.endDate && subscription.endDate < todayIso) return "ended";
  return "active";
}

/**
 * Kolejność listy: aktywne wg najbliższej płatności, potem zakończone,
 * wstrzymane na końcu; w grupach po nazwie.
 */
export function sortSubscriptions(
  subscriptions: readonly Subscription[],
  todayIso: string,
): Subscription[] {
  const yesterday = addDaysIso(todayIso, -1);
  const rank = { active: 0, ended: 1, paused: 2 } as const;
  const keyed = subscriptions.map((s) => ({
    s,
    status: getSubscriptionStatus(s, todayIso),
    next: nextOccurrence(s, yesterday),
  }));
  keyed.sort((a, b) => {
    if (a.status !== b.status) return rank[a.status] - rank[b.status];
    if (a.status === "active" && a.next !== b.next) {
      return (a.next ?? "9999-12-31").localeCompare(b.next ?? "9999-12-31");
    }
    return a.s.name.localeCompare(b.s.name, "pl");
  });
  return keyed.map((k) => k.s);
}

/** Czy transakcja dla tej subskrypcji i daty już istnieje (reguła idempotentności). */
export function isPaymentRecorded(
  transactions: readonly Transaction[],
  subscriptionId: string,
  date: string,
): boolean {
  return transactions.some((t) => t.subscriptionId === subscriptionId && t.date === date);
}

/**
 * Płatności wszystkich subskrypcji w przedziale [fromIso, toIso], posortowane
 * po dacie, potem po nazwie, z flagą `paid` (jest transakcja subscriptionId + data).
 */
export function buildPayments(
  subscriptions: readonly Subscription[],
  transactions: readonly Transaction[],
  fromIso: string,
  toIso: string,
): { occurrences: PaymentOccurrence[]; byDate: Record<string, PaymentOccurrence[]>; total: number } {
  const recorded = new Set(
    transactions
      .filter((t) => t.subscriptionId !== undefined)
      .map((t) => `${t.subscriptionId}|${t.date}`),
  );

  const occurrences: PaymentOccurrence[] = [];
  for (const subscription of subscriptions) {
    for (const date of getOccurrences(subscription, fromIso, toIso)) {
      occurrences.push({
        subscriptionId: subscription.id,
        subscription,
        date,
        amount: subscription.amount,
        paid: recorded.has(`${subscription.id}|${date}`),
      });
    }
  }
  occurrences.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.subscription.name.localeCompare(b.subscription.name, "pl"),
  );

  const byDate: Record<string, PaymentOccurrence[]> = {};
  for (const o of occurrences) (byDate[o.date] ??= []).push(o);

  return {
    occurrences,
    byDate,
    total: roundMoney(occurrences.reduce((sum, o) => sum + o.amount, 0)),
  };
}
