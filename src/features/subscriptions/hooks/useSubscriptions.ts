import { useMemo } from "react";
import { todayIso } from "@/features/transactions/utils/isoDate";
import { summarizeSubscriptions } from "../schedule";
import { useSubscriptionsStore } from "../store";

/**
 * Lista subskrypcji + podsumowania. Do `active` i do sum wchodzą tylko
 * subskrypcje aktywne i niezakończone; `ended` (endDate minęła) i `paused` osobno.
 * Logika (bez Reacta) jest w `summarizeSubscriptions` — tam też jej testy.
 */
export function useSubscriptions() {
  const all = useSubscriptionsStore((s) => s.subscriptions);
  return useMemo(() => summarizeSubscriptions(all, todayIso()), [all]);
}
