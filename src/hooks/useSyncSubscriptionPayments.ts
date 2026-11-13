import { useEffect } from "react";
import { useSubscriptionsStore } from "@/features/subscriptions";
import { todayIso, useTransactionsStore } from "@/features/transactions";
import { planSubscriptionPayments, type SyncedThrough } from "@/lib/planSubscriptionPayments";

const STORAGE_KEY = "dorado-subscription-sync";

function readSynced(): SyncedThrough {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as SyncedThrough) : {};
  } catch {
    return {};
  }
}

function writeSynced(value: SyncedThrough) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // brak zapisu (tryb prywatny) — w najgorszym razie płatności policzą się ponownie po odświeżeniu
  }
}

/** Dopisuje do historii transakcji wydatki z subskrypcji, których termin już minął (lub jest dziś). */
export function syncSubscriptionPayments(): void {
  const { subscriptions } = useSubscriptionsStore.getState();
  const { transactions } = useTransactionsStore.getState();
  const before = readSynced();

  const plan = planSubscriptionPayments(subscriptions, transactions, before, todayIso());

  if (plan.created.length > 0) {
    useTransactionsStore.setState((state) => ({
      transactions: [...plan.created, ...state.transactions],
    }));
  }
  if (JSON.stringify(plan.syncedThrough) !== JSON.stringify(before)) {
    writeSynced(plan.syncedThrough);
  }
}

/**
 * Działa bez backendu: przy starcie aplikacji, po każdej zmianie subskrypcji
 * i po powrocie do karty (np. następnego dnia) zamienia nadchodzące terminy w transakcje.
 * Podpinamy raz, w AppLayout, żeby działało na każdej podstronie.
 */
export function useSyncSubscriptionPayments(): void {
  useEffect(() => {
    syncSubscriptionPayments();
    const unsubscribe = useSubscriptionsStore.subscribe(syncSubscriptionPayments);
    const onVisible = () => {
      if (document.visibilityState === "visible") syncSubscriptionPayments();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
