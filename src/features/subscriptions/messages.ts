import { formatPLN } from "@/features/transactions/utils/money";
import type { SubscriptionSavedEvent } from "./hooks/useSubscriptionForm";
import type { BillingPeriod, Subscription, SubscriptionStatus } from "./types";

/** Etykiety do selectów, kart i listy. */
export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "Miesięcznie",
  yearly: "Rocznie",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Aktywna",
  paused: "Wstrzymana",
  ended: "Zakończona",
};

const PERIOD_SUFFIX: Record<BillingPeriod, string> = {
  monthly: "mies.",
  yearly: "rok",
};

/** Np. „49,99 zł / mies.” */
export function formatSubscriptionCost(subscription: Subscription): string {
  return `${formatPLN(subscription.amount)} / ${PERIOD_SUFFIX[subscription.period]}`;
}

/** Gotowe teksty do Toastów i dialogów (UI tylko je wyświetla). */
export function savedSubscriptionMessage(event: SubscriptionSavedEvent): string {
  const { subscription: s } = event;
  return event.action === "created"
    ? `Dodano subskrypcję „${s.name}” (${formatSubscriptionCost(s)})`
    : `Zapisano zmiany w subskrypcji „${s.name}”`;
}

export function removedSubscriptionMessage(subscription: Subscription): string {
  return `Usunięto subskrypcję „${subscription.name}”`;
}

export function confirmRemoveSubscriptionText(subscription: Subscription): string {
  return `Czy na pewno usunąć subskrypcję „${subscription.name}”? Dotychczasowe płatności pozostaną w historii transakcji.`;
}

export function pausedSubscriptionMessage(subscription: Subscription): string {
  return `Wstrzymano subskrypcję „${subscription.name}”`;
}

export function resumedSubscriptionMessage(subscription: Subscription): string {
  return `Wznowiono subskrypcję „${subscription.name}”`;
}
