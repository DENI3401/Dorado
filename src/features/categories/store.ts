import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "./types";
import type { CategoryFormValues } from "./schema";

/** Zweryfikowane pola kategorii; `forSubscriptions` można pominąć (nowa: false, edycja: bez zmian). */
export type CategoryValues = Omit<CategoryFormValues, "forSubscriptions"> &
  Partial<Pick<CategoryFormValues, "forSubscriptions">>;

/**
 * Pola z formularza → kategoria własna. Flaga subskrypcji trafia do danych tylko dla wydatków
 * i tylko jako `true` — kategoria przychodów nie może być kategorią subskrypcji.
 */
function toCustomCategory(id: string, values: CategoryValues): Category {
  return {
    id,
    name: values.name,
    type: values.type,
    icon: values.icon,
    color: values.color,
    isDefault: false,
    ...(values.type === "expense" && values.forSubscriptions === true && { forSubscriptions: true }),
  };
}

interface CategoriesState {
  /** Tylko kategorie własne; domyślne są stałą w kodzie. */
  customCategories: Category[];
  addCategory: (values: CategoryValues) => Category;
  updateCategory: (id: string, values: CategoryValues) => Category | null;
  removeCategory: (id: string) => Category | null;
}

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set, get) => ({
      customCategories: [],

      addCategory: (values) => {
        const category = toCustomCategory(crypto.randomUUID(), values);
        set((s) => ({ customCategories: [...s.customCategories, category] }));
        return category;
      },

      updateCategory: (id, values) => {
        const current = get().customCategories.find((c) => c.id === id);
        if (!current) return null;
        const updated = toCustomCategory(current.id, {
          ...values,
          forSubscriptions: values.forSubscriptions ?? current.forSubscriptions,
        });
        set((s) => ({
          customCategories: s.customCategories.map((c) => (c.id === id ? updated : c)),
        }));
        return updated;
      },

      removeCategory: (id) => {
        const removed = get().customCategories.find((c) => c.id === id) ?? null;
        if (removed) {
          set((s) => ({
            customCategories: s.customCategories.filter((c) => c.id !== id),
          }));
        }
        return removed;
      },
    }),
    {
      name: "dorado-categories",
      version: 1,
      partialize: (s) => ({ customCategories: s.customCategories }),
    },
  ),
);
