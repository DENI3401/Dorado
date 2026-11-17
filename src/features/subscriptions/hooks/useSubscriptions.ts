import { useMemo } from "react";
import { todayIso } from "@/features/transactions/utils/isoDate";
import {
  addDaysIso,
  getSubscriptionStatus,
  nextOccurrence,
  sortSubscriptions,
  sumMonthlyCost,
  sumYearlyCost,
} from "../schedule";
import { useSubscriptionsStore } from "../store";

/**
 * Lista subskrypcji + podsumowania. Do `active` i do sum wchodzą tylko
 * subskrypcje aktywne i niezakończone; `ended` (endDate minęła) i `paused` osobno.
 */
export function useSubscriptions() {
  const all = useSubscriptionsStore((s) => s.subscriptions);

  return useMemo(() => {
    const today = todayIso();
    const subscriptions = sortSubscriptions(all, today);
    const active = subscriptions.filter((s) => getSubscriptionStatus(s, today) === "active");
    const paused = subscriptions.filter((s) => getSubscriptionStatus(s, today) === "paused");
    const ended = subscriptions.filter((s) => getSubscriptionStatus(s, today) === "ended");

    const yesterday = addDaysIso(today, -1);
    /** Najbliższa płatność każdej subskrypcji (null: wstrzymana lub zakończona). */
    const nextPaymentById: Record<string, string | null> = {};
    for (const s of subscriptions) nextPaymentById[s.id] = nextOccurrence(s, yesterday);

    return {
      subscriptions,
      active,
      paused,
      ended,
      nextPaymentById,
      monthlyTotal: sumMonthlyCost(active),
      yearlyTotal: sumYearlyCost(active),
      isEmpty: all.length === 0,
    };
  }, [all]);
}
