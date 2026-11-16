import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SubscriptionFormValues } from "./schema";
import { applyValues, createSubscription } from "./model";
import type { Subscription } from "./types";

interface SubscriptionsState {
  subscriptions: Subscription[];
  addSubscription: (values: SubscriptionFormValues) => Subscription;
  updateSubscription: (id: string, values: SubscriptionFormValues) => Subscription | null;
  /** Zwraca usuniętą subskrypcję (do Undo w toaście) albo null. Transakcje zostają w historii. */
  removeSubscription: (id: string) => Subscription | null;
  /** Przywraca wcześniej usuniętą subskrypcję (Undo), bez duplikatu po id. */
  restoreSubscription: (subscription: Subscription) => void;
  /** Pauza / wznowienie; zwraca zaktualizowaną subskrypcję albo null. */
  setActive: (id: string, isActive: boolean) => Subscription | null;
  /** Przepina subskrypcje z jednej kategorii na inną; zwraca liczbę zmienionych. */
  reassignCategory: (fromId: string, toId: string) => number;
}

export const useSubscriptionsStore = create<SubscriptionsState>()(
  persist(
    (set, get) => ({
      subscriptions: [],

      addSubscription: (values) => {
        const subscription = createSubscription(values);
        set((s) => ({ subscriptions: [subscription, ...s.subscriptions] }));
        return subscription;
      },

      updateSubscription: (id, values) => {
        const current = get().subscriptions.find((s) => s.id === id);
        if (!current) return null;
        const updated = applyValues(current, values);
        set((s) => ({
          subscriptions: s.subscriptions.map((x) => (x.id === id ? updated : x)),
        }));
        return updated;
      },

      removeSubscription: (id) => {
        const removed = get().subscriptions.find((s) => s.id === id) ?? null;
        if (removed) {
          set((s) => ({ subscriptions: s.subscriptions.filter((x) => x.id !== id) }));
        }
        return removed;
      },

      restoreSubscription: (subscription) => {
        set((s) =>
          s.subscriptions.some((x) => x.id === subscription.id)
            ? s
            : { subscriptions: [subscription, ...s.subscriptions] },
        );
      },

      setActive: (id, isActive) => {
        const current = get().subscriptions.find((s) => s.id === id);
        if (!current) return null;
        const updated: Subscription = { ...current, isActive };
        set((s) => ({
          subscriptions: s.subscriptions.map((x) => (x.id === id ? updated : x)),
        }));
        return updated;
      },

      reassignCategory: (fromId, toId) => {
        let count = 0;
        set((s) => ({
          subscriptions: s.subscriptions.map((x) => {
            if (x.categoryId !== fromId) return x;
            count += 1;
            return { ...x, categoryId: toId };
          }),
        }));
        return count;
      },
    }),
    {
      name: "dorado-subscriptions",
      version: 1,
      partialize: (s) => ({ subscriptions: s.subscriptions }),
    },
  ),
);
