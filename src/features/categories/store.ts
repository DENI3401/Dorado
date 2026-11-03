import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "./types";
import type { CategoryFormValues } from "./schema";

interface CategoriesState {
  /** Tylko kategorie własne; domyślne są stałą w kodzie. */
  customCategories: Category[];
  addCategory: (values: CategoryFormValues) => Category;
  updateCategory: (id: string, values: CategoryFormValues) => Category | null;
  removeCategory: (id: string) => Category | null;
}

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set, get) => ({
      customCategories: [],

      addCategory: (values) => {
        const category: Category = {
          id: crypto.randomUUID(),
          name: values.name,
          type: values.type,
          icon: values.icon,
          color: values.color,
          isDefault: false,
        };
        set((s) => ({ customCategories: [...s.customCategories, category] }));
        return category;
      },

      updateCategory: (id, values) => {
        const current = get().customCategories.find((c) => c.id === id);
        if (!current) return null;
        const updated: Category = { ...current, ...values };
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
