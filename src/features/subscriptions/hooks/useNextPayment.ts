import { useMemo } from "react";
import { todayIso } from "@/features/transactions/utils/isoDate";
import { addDaysIso, nextOccurrence } from "../schedule";
import { useSubscriptionsStore } from "../store";

/**
 * Data najbliższej płatności (dzisiejsza też się liczy) dla karty subskrypcji.
 * null, gdy subskrypcja jest wstrzymana, zakończona albo nie istnieje.
 */
export function useNextPayment(subscriptionId: string): string | null {
  const subscription = useSubscriptionsStore((s) =>
    s.subscriptions.find((x) => x.id === subscriptionId),
  );
  return useMemo(
    () => (subscription ? nextOccurrence(subscription, addDaysIso(todayIso(), -1)) : null),
    [subscription],
  );
}
