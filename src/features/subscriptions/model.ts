import type { SubscriptionFormValues } from "./schema";
import type { Subscription } from "./types";

export function createSubscription(
  values: SubscriptionFormValues,
  now: Date = new Date(),
): Subscription {
  return {
    id: crypto.randomUUID(),
    name: values.name,
    amount: values.amount,
    categoryId: values.categoryId,
    period: values.period,
    startDate: values.startDate,
    endDate: values.endDate === "" ? null : values.endDate,
    isActive: true,
    note: values.note,
    createdAt: now.toISOString(),
  };
}

/** Nakłada wartości z formularza; id, createdAt i isActive (pauza) zostają. */
export function applyValues(
  subscription: Subscription,
  values: SubscriptionFormValues,
): Subscription {
  return {
    ...subscription,
    name: values.name,
    amount: values.amount,
    categoryId: values.categoryId,
    period: values.period,
    startDate: values.startDate,
    endDate: values.endDate === "" ? null : values.endDate,
    note: values.note,
  };
}
