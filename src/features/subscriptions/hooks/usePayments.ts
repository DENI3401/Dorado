import { useMemo } from "react";
import { useTransactionsStore } from "@/features/transactions/store";
import { buildPayments } from "../schedule";
import { useSubscriptionsStore } from "../store";

interface Range {
  /** YYYY-MM-DD, włącznie. */
  from: string;
  /** YYYY-MM-DD, włącznie. */
  to: string;
}

/**
 * Plan płatności w przedziale [from, to] — dane do kalendarza.
 * Subskrypcje wstrzymane nie dają płatności. Flaga `paid` wynika
 * z istnienia transakcji z tym `subscriptionId` i datą płatności.
 */
export function usePayments({ from, to }: Range) {
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const transactions = useTransactionsStore((s) => s.transactions);

  return useMemo(
    () => buildPayments(subscriptions, transactions, from, to),
    [subscriptions, transactions, from, to],
  );
}
