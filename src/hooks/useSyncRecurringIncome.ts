import { useEffect } from "react";
import { useRecurringIncomeStore } from "@/features/recurring-income/store";
import { syncRecurringIncome } from "@/features/recurring-income/sync";

/**
 * Działa bez backendu: przy starcie aplikacji, po każdej zmianie wynagrodzeń cyklicznych
 * i po powrocie do karty (np. następnego dnia) księguje wpływy, których termin już nadszedł.
 * Podpinamy raz, w AppLayout, żeby działało na każdej podstronie.
 */
export function useSyncRecurringIncome(): void {
  useEffect(() => {
    // Osobne wywołania w funkcjach strzałkowych: subscribe przekazuje (state, prev),
    // a syncRecurringIncome przyjmuje jako pierwszy argument datę.
    syncRecurringIncome();
    const unsubscribe = useRecurringIncomeStore.subscribe(() => {
      syncRecurringIncome();
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") syncRecurringIncome();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
