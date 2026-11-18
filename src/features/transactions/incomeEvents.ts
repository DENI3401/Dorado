import { useTransactionsStore } from "./store";
import type { Transaction } from "./types";

/** Przychód uznajemy za „nowy”, jeśli utworzono go w ciągu ostatniej minuty. */
export const FRESH_INCOME_WINDOW_MS = 60_000;

/**
 * Przychody, które pojawiły się w `next`, a nie było ich w `prev` — i zostały utworzone przed chwilą.
 *
 * Warunek świeżości odcina przypadki, które NIE są nowym wpływem: wczytanie danych z localStorage,
 * import kopii zapasowej (F14) i cofnięcie usunięcia (Undo) przywracają stare operacje.
 * Nowe wpływy to: przychód z formularza (F8) i wynagrodzenie księgowane automatycznie (F9).
 */
export function findNewIncome(
  prev: readonly Transaction[],
  next: readonly Transaction[],
  now: Date = new Date(),
): Transaction[] {
  if (prev === next) return [];
  const known = new Set(prev.map((t) => t.id));
  const threshold = now.getTime() - FRESH_INCOME_WINDOW_MS;
  return next.filter(
    (t) => t.type === "income" && !known.has(t.id) && Date.parse(t.createdAt) >= threshold,
  );
}

/**
 * Wywołuje `listener` za każdym razem, gdy w historii pojawi się nowy przychód (jednorazowy
 * lub wynagrodzenie cykliczne). Zwraca funkcję odpinającą nasłuch.
 *
 * To punkt zaczepienia dla F3 (alert niskiego salda, „Trigger Once”): flaga
 * `lowBalanceAlertTriggered` resetuje się po zaksięgowaniu nowego przychodu, np.
 *
 *   onNewIncome(() => useAlertStore.getState().resetLowBalanceFlag());
 */
export function onNewIncome(listener: (income: Transaction[]) => void): () => void {
  return useTransactionsStore.subscribe((state, prev) => {
    const added = findNewIncome(prev.transactions, state.transactions);
    if (added.length > 0) listener(added);
  });
}
