import { getOccurrences, isPaymentRecorded } from "@/features/subscriptions/schedule";
import type { Subscription } from "@/features/subscriptions/types";
import type { Transaction } from "@/features/transactions/types";

/** Do kiedy (włącznie) płatności każdej subskrypcji zostały już przetworzone: id → YYYY-MM-DD. */
export type SyncedThrough = Record<string, string>;

export interface PaymentPlan {
  /** Nowe wydatki do dopisania do historii transakcji. */
  created: Transaction[];
  /** Zaktualizowana mapa „przetworzone do”. */
  syncedThrough: SyncedThrough;
}

/**
 * Wylicza, które płatności subskrypcji wpadły w historię transakcji (daty ≤ today).
 *
 * - Płatność tworzymy tylko raz: daty ≤ syncedThrough[id] są już rozliczone, więc ręcznie
 *   usunięta transakcja nie wraca po odświeżeniu strony.
 * - Pierwsze uruchomienie dla subskrypcji (brak wpisu) dopisuje płatności od startDate.
 * - Wstrzymana subskrypcja nic nie tworzy, ale „przetworzone do” i tak przesuwa się na dziś,
 *   więc po wznowieniu nie dopisują się płatności z okresu pauzy.
 * - Gdy transakcja z tą parą (subscriptionId, data) już istnieje, nie powstaje druga.
 */
export function planSubscriptionPayments(
  subscriptions: readonly Subscription[],
  transactions: readonly Transaction[],
  syncedThrough: SyncedThrough,
  today: string,
  now: Date = new Date(),
): PaymentPlan {
  const created: Transaction[] = [];
  const next: SyncedThrough = { ...syncedThrough };

  for (const subscription of subscriptions) {
    const through = syncedThrough[subscription.id];
    for (const date of getOccurrences(subscription, subscription.startDate, today)) {
      if (through !== undefined && date <= through) continue;
      if (isPaymentRecorded(transactions, subscription.id, date)) continue;
      created.push({
        id: crypto.randomUUID(),
        type: "expense",
        incomeKind: null,
        amount: subscription.amount,
        categoryId: subscription.categoryId,
        date,
        note: subscription.name,
        createdAt: now.toISOString(),
        subscriptionId: subscription.id,
      });
    }
    if (through === undefined || through < today) next[subscription.id] = today;
  }

  return { created, syncedThrough: next };
}
