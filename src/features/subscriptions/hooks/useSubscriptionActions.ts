import { useCallback } from "react";
import { useSubscriptionsStore } from "../store";
import type { Subscription } from "../types";

export interface RemovedSubscription {
  subscription: Subscription;
  /** Przywraca usuniętą subskrypcję — podepnij pod przycisk „Cofnij” w toaście. */
  undo: () => void;
}

/** Usuwanie (z Undo) oraz pauza / wznowienie. Potwierdzenie w modalu robi UI. */
export function useSubscriptionActions() {
  const removeSubscription = useSubscriptionsStore((s) => s.removeSubscription);
  const restoreSubscription = useSubscriptionsStore((s) => s.restoreSubscription);
  const setActiveInStore = useSubscriptionsStore((s) => s.setActive);

  const remove = useCallback(
    (id: string): RemovedSubscription | null => {
      const subscription = removeSubscription(id);
      if (!subscription) return null;
      return { subscription, undo: () => restoreSubscription(subscription) };
    },
    [removeSubscription, restoreSubscription],
  );

  /** Zwraca zaktualizowaną subskrypcję (do tekstu w toaście) albo null. */
  const setActive = useCallback(
    (id: string, isActive: boolean): Subscription | null => setActiveInStore(id, isActive),
    [setActiveInStore],
  );

  return { remove, setActive };
}
