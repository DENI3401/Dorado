import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createRecurringIncome } from "./model";
import type { NewRecurringIncome, RecurringIncome } from "./types";

interface RecurringIncomeState {
  recurringIncomes: RecurringIncome[];
  addRecurringIncome: (values: NewRecurringIncome) => RecurringIncome;
  /** Zwraca usunięte wynagrodzenie (do Undo w toaście) albo null. Zaksięgowane wpływy zostają w historii. */
  removeRecurringIncome: (id: string) => RecurringIncome | null;
  /** Przywraca wcześniej usunięte wynagrodzenie (Undo), bez duplikatu po id. */
  restoreRecurringIncome: (recurringIncome: RecurringIncome) => void;
  /** Pauza / wznowienie; zwraca zaktualizowane wynagrodzenie albo null. */
  setActive: (id: string, isActive: boolean) => RecurringIncome | null;
  /**
   * Zapisuje „rozliczone do” (id → YYYY-MM-DD). Gdy nic się nie zmienia, stan zostaje ten sam
   * obiekt — dzięki temu subskrypcja na magazyn nie wpada w pętlę.
   */
  markGenerated: (through: Record<string, string>) => void;
  /** Przepina wynagrodzenia z jednej kategorii na inną; zwraca liczbę zmienionych. */
  reassignCategory: (fromId: string, toId: string) => number;
}

export const useRecurringIncomeStore = create<RecurringIncomeState>()(
  persist(
    (set, get) => ({
      recurringIncomes: [],

      addRecurringIncome: (values) => {
        const recurringIncome = createRecurringIncome(values);
        set((s) => ({ recurringIncomes: [recurringIncome, ...s.recurringIncomes] }));
        return recurringIncome;
      },

      removeRecurringIncome: (id) => {
        const removed = get().recurringIncomes.find((r) => r.id === id) ?? null;
        if (removed) {
          set((s) => ({ recurringIncomes: s.recurringIncomes.filter((r) => r.id !== id) }));
        }
        return removed;
      },

      restoreRecurringIncome: (recurringIncome) => {
        set((s) =>
          s.recurringIncomes.some((r) => r.id === recurringIncome.id)
            ? s
            : { recurringIncomes: [recurringIncome, ...s.recurringIncomes] },
        );
      },

      setActive: (id, isActive) => {
        const current = get().recurringIncomes.find((r) => r.id === id);
        if (!current) return null;
        const updated: RecurringIncome = { ...current, isActive };
        set((s) => ({
          recurringIncomes: s.recurringIncomes.map((r) => (r.id === id ? updated : r)),
        }));
        return updated;
      },

      markGenerated: (through) => {
        set((s) => {
          let changed = false;
          const recurringIncomes = s.recurringIncomes.map((r) => {
            const value = through[r.id];
            if (value === undefined || value === r.generatedThrough) return r;
            changed = true;
            return { ...r, generatedThrough: value };
          });
          return changed ? { recurringIncomes } : s;
        });
      },

      reassignCategory: (fromId, toId) => {
        let count = 0;
        set((s) => ({
          recurringIncomes: s.recurringIncomes.map((r) => {
            if (r.categoryId !== fromId) return r;
            count += 1;
            return { ...r, categoryId: toId };
          }),
        }));
        return count;
      },
    }),
    {
      name: "dorado-recurring-income",
      version: 1,
      partialize: (s) => ({ recurringIncomes: s.recurringIncomes }),
    },
  ),
);
