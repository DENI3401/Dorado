import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AlertState {
  /** Czy alert niskiego salda został już pokazany w cyklu `alertCycleStart` (README 4.3.3). */
  lowBalanceAlertTriggered: boolean;
  /**
   * Początek cyklu (YYYY-MM-DD), w którym alert zadziałał. Flaga jest aktywna tylko wtedy, gdy
   * `alertCycleStart` równa się początkowi bieżącego cyklu — nowy cykl (także po zmianie dnia
   * cyklu) „resetuje” flagę sam, bez timerów.
   */
  alertCycleStart: string | null;
  markLowBalanceTriggered: (cycleStart: string) => void;
  resetLowBalanceFlag: () => void;
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set) => ({
      lowBalanceAlertTriggered: false,
      alertCycleStart: null,

      markLowBalanceTriggered: (cycleStart) =>
        set({ lowBalanceAlertTriggered: true, alertCycleStart: cycleStart }),

      resetLowBalanceFlag: () => set({ lowBalanceAlertTriggered: false, alertCycleStart: null }),
    }),
    {
      name: "dorado-alerts",
      version: 1,
      partialize: (s) => ({
        lowBalanceAlertTriggered: s.lowBalanceAlertTriggered,
        alertCycleStart: s.alertCycleStart,
      }),
    },
  ),
);
