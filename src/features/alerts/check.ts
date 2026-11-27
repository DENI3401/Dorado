import { toast } from "sonner";
import { getCycleBalance, getCycleRange } from "@/features/budget-cycle";
import { useSettingsStore } from "@/features/settings";
import { useTransactionsStore } from "@/features/transactions/store";
import { todayIso } from "@/features/transactions/utils/isoDate";
import { shouldNotifyLowBalance } from "./lowBalance";
import { lowBalanceMessage } from "./messages";
import { useAlertStore } from "./store";

export interface CheckLowBalanceOptions {
  /** Pomija jednorazowość w cyklu — dla zmiany progu w ustawieniach (F6). */
  force?: boolean;
  /** Data YYYY-MM-DD „dzisiaj” (domyślnie dzisiejsza; przydatne w testach). */
  today?: string;
}

/**
 * Sprawdza saldo bieżącego cyklu i — jeśli trzeba — pokazuje alert niskiego salda.
 * Czyta stan bezpośrednio z magazynów (getState), więc można ją wołać z dowolnego miejsca.
 * Zwraca true, gdy alert został pokazany.
 */
export function checkLowBalance(options: CheckLowBalanceOptions = {}): boolean {
  const { transactions } = useTransactionsStore.getState();
  const { cycleStartDay, lowBalanceThreshold } = useSettingsStore.getState();
  const { lowBalanceAlertTriggered, alertCycleStart } = useAlertStore.getState();

  const cycle = getCycleRange(options.today ?? todayIso(), cycleStartDay);
  const { expense, balance } = getCycleBalance(transactions, cycle);

  const notify = shouldNotifyLowBalance({
    balance,
    threshold: lowBalanceThreshold,
    triggered: lowBalanceAlertTriggered,
    alertCycleStart,
    cycleStart: cycle.start,
    force: options.force,
  });
  if (!notify) return false;

  // Stałe id: sonner nie pokaże dwóch takich samych toastów naraz (np. podwójny efekt w StrictMode).
  toast.warning(lowBalanceMessage(expense, balance), { id: "low-balance", duration: 10_000 });
  useAlertStore.getState().markLowBalanceTriggered(cycle.start);
  return true;
}
