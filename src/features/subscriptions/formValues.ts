import { SUBSCRIPTIONS_CATEGORY_ID } from "@/features/categories/defaultCategories";
import type { SubscriptionFormInput } from "./schema";
import type { Subscription } from "./types";

/** Startowe wartości formularza „Nowa subskrypcja”: kategoria „Subskrypcje”, okres miesięczny, start dziś. */
export function subscriptionFormDefaults(todayIso: string): SubscriptionFormInput {
  return {
    name: "",
    amount: "",
    categoryId: SUBSCRIPTIONS_CATEGORY_ID,
    period: "monthly",
    startDate: todayIso,
    endDate: "",
    note: "",
  };
}

/** Subskrypcja → wartości pól formularza edycji (kwota jako tekst, brak końca jako pusty napis). */
export function subscriptionToFormInput(subscription: Subscription): SubscriptionFormInput {
  return {
    name: subscription.name,
    amount: String(subscription.amount),
    categoryId: subscription.categoryId,
    period: subscription.period,
    startDate: subscription.startDate,
    endDate: subscription.endDate ?? "",
    note: subscription.note,
  };
}
