/** Czysta logika alertu niskiego salda (bez Reacta, magazynów i toastów). */

/** Saldo ściśle poniżej progu. Próg 0 (lub mniejszy) oznacza alert wyłączony. */
export function isBelowThreshold(balance: number, threshold: number): boolean {
  return threshold > 0 && balance < threshold;
}

export interface LowBalanceCheckInput {
  /** Saldo cyklu z rollover (getCycleBalance). */
  balance: number;
  threshold: number;
  /** Flaga z useAlertStore. */
  triggered: boolean;
  /** Cykl, w którym flaga została ustawiona (useAlertStore). */
  alertCycleStart: string | null;
  /** Początek bieżącego cyklu. */
  cycleStart: string;
  /** Zmiana progu w ustawieniach: ostrzegamy od razu, nawet gdy flaga jest aktywna. */
  force?: boolean;
}

/**
 * „Trigger Once”: alert tylko wtedy, gdy saldo jest poniżej progu i w tym cyklu jeszcze
 * nie został pokazany. `force` pomija jednorazowość (ale nie próg).
 */
export function shouldNotifyLowBalance({
  balance,
  threshold,
  triggered,
  alertCycleStart,
  cycleStart,
  force = false,
}: LowBalanceCheckInput): boolean {
  if (!isBelowThreshold(balance, threshold)) return false;
  if (force) return true;
  return !triggered || alertCycleStart !== cycleStart;
}
