import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SUBSCRIPTIONS_CATEGORY_ID } from "@/features/categories/defaultCategories";
import { useAllCategories } from "@/features/categories/hooks/useAllCategories";
import { todayIso } from "@/features/transactions/utils/isoDate";
import {
  makeSubscriptionFormSchema,
  type SubscriptionFormInput,
  type SubscriptionFormValues,
} from "../schema";
import { useSubscriptionsStore } from "../store";
import type { Subscription } from "../types";

export type SubscriptionSavedEvent =
  | { action: "created"; subscription: Subscription }
  | { action: "updated"; subscription: Subscription };

interface Options {
  /** Przekaż, aby edytować istniejącą subskrypcję. */
  subscription?: Subscription;
  /** Wywoływane po zapisie — tu UI pokazuje Toast i zamyka modal. */
  onSaved?: (event: SubscriptionSavedEvent) => void;
}

function emptyDefaults(): SubscriptionFormInput {
  return {
    name: "",
    amount: "",
    categoryId: SUBSCRIPTIONS_CATEGORY_ID,
    period: "monthly",
    startDate: todayIso(),
    endDate: "",
    note: "",
  };
}

function fromSubscription(s: Subscription): SubscriptionFormInput {
  return {
    name: s.name,
    amount: String(s.amount),
    categoryId: s.categoryId,
    period: s.period,
    startDate: s.startDate,
    endDate: s.endDate ?? "",
    note: s.note,
  };
}

/** Bezgłowa logika formularza subskrypcji (bez żadnego JSX). */
export function useSubscriptionForm({ subscription, onSaved }: Options = {}) {
  const allCategories = useAllCategories();
  const addSubscription = useSubscriptionsStore((s) => s.addSubscription);
  const updateSubscription = useSubscriptionsStore((s) => s.updateSubscription);

  const schema = useMemo(() => makeSubscriptionFormSchema(allCategories), [allCategories]);
  const categories = useMemo(
    () => allCategories.filter((c) => c.type === "expense"),
    [allCategories],
  );

  const form = useForm<SubscriptionFormInput, unknown, SubscriptionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: subscription ? fromSubscription(subscription) : emptyDefaults(),
  });

  const submit = form.handleSubmit((values) => {
    if (subscription) {
      const updated = updateSubscription(subscription.id, values);
      if (updated) onSaved?.({ action: "updated", subscription: updated });
      return;
    }
    const created = addSubscription(values);
    onSaved?.({ action: "created", subscription: created });
    form.reset(emptyDefaults());
  });

  return {
    form,
    submit,
    isEditing: Boolean(subscription),
    /** Tylko kategorie wydatków — do pola select. */
    categories,
  };
}
