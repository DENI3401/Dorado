import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SETTINGS, type BudgetSettings } from "./types";

interface SettingsState extends BudgetSettings {
  /** Zapisuje zmiany i zwraca poprzednie wartości (do Undo w toaście). */
  updateSettings: (patch: Partial<BudgetSettings>) => BudgetSettings;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (patch) => {
        const { cycleStartDay, lowBalanceThreshold } = get();
        const previous: BudgetSettings = { cycleStartDay, lowBalanceThreshold };
        set({
          // Pomijamy pola niepodane (lub undefined), żeby nie nadpisać ich wartością pustą.
          ...(patch.cycleStartDay !== undefined && { cycleStartDay: patch.cycleStartDay }),
          ...(patch.lowBalanceThreshold !== undefined && {
            lowBalanceThreshold: patch.lowBalanceThreshold,
          }),
        });
        return previous;
      },

      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "dorado-settings",
      version: 1,
      partialize: (s) => ({
        cycleStartDay: s.cycleStartDay,
        lowBalanceThreshold: s.lowBalanceThreshold,
      }),
    },
  ),
);
