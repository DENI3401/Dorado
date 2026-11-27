import { useEffect } from "react";
import { checkLowBalance } from "@/features/alerts/check";
import { useAlertStore } from "@/features/alerts/store";
import { onNewIncome } from "@/features/transactions/incomeEvents";
import { useTransactionsStore } from "@/features/transactions/store";

/**
 * Pilnuje salda cyklu na każdej podstronie: przy starcie, po każdej zmianie transakcji
 * (nowy wydatek, edycja, usunięcie), po powrocie do karty (nowy dzień = być może nowy cykl)
 * oraz po nowym przychodzie, który najpierw zeruje flagę „Trigger Once”.
 * Podpinamy raz, w AppLayout — po useSyncSubscriptionPayments i useSyncRecurringIncome,
 * żeby automatyczne księgowania poszły przed sprawdzeniem.
 */
export function useLowBalanceAlert(): void {
  useEffect(() => {
    checkLowBalance();

    // Osobna funkcja strzałkowa: subscribe przekazuje (state, prev), a checkLowBalance
    // przyjmuje obiekt opcji.
    const unsubscribeTransactions = useTransactionsStore.subscribe(() => {
      checkLowBalance();
    });

    const unsubscribeIncome = onNewIncome(() => {
      useAlertStore.getState().resetLowBalanceFlag();
      checkLowBalance();
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") checkLowBalance();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsubscribeTransactions();
      unsubscribeIncome();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
