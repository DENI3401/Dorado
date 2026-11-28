import { useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAllCategories } from "@/features/categories/hooks/useAllCategories";
import { todayIso } from "@/features/transactions/utils/isoDate";
import { categoryIdsInUse, subscriptionCategoryOptions } from "../categories";
import { subscriptionFormDefaults, subscriptionToFormInput } from "../formValues";
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

/** Bezgłowa logika formularza subskrypcji (bez żadnego JSX). */
export function useSubscriptionForm({ subscription, onSaved }: Options = {}) {
  const allCategories = useAllCategories();
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const addSubscription = useSubscriptionsStore((s) => s.addSubscription);
  const updateSubscription = useSubscriptionsStore((s) => s.updateSubscription);

  // Schemat zna wszystkie kategorie — także dodaną przed chwilą z poziomu tego formularza.
  const schema = useMemo(() => makeSubscriptionFormSchema(allCategories), [allCategories]);

  const form = useForm<SubscriptionFormInput, unknown, SubscriptionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: subscription
      ? subscriptionToFormInput(subscription)
      : subscriptionFormDefaults(todayIso()),
  });

  const selectedCategoryId = useWatch({ control: form.control, name: "categoryId" });
  const usedCategoryIds = useMemo(() => categoryIdsInUse(subscriptions), [subscriptions]);
  const categories = useMemo(
    () =>
      subscriptionCategoryOptions(allCategories, {
        usedIds: usedCategoryIds,
        selectedId: selectedCategoryId,
      }),
    [allCategories, usedCategoryIds, selectedCategoryId],
  );

  /** Zaznacza kategorię (np. właśnie utworzoną w oknie „Nowa kategoria”) i czyści błąd pola. */
  const selectCategory = useCallback(
    (categoryId: string) => {
      form.setValue("categoryId", categoryId, { shouldDirty: true });
      form.clearErrors("categoryId");
    },
    [form],
  );

  const submit = form.handleSubmit((values) => {
    if (subscription) {
      const updated = updateSubscription(subscription.id, values);
      if (updated) onSaved?.({ action: "updated", subscription: updated });
      return;
    }
    const created = addSubscription(values);
    onSaved?.({ action: "created", subscription: created });
    form.reset(subscriptionFormDefaults(todayIso()));
  });

  return {
    form,
    submit,
    isEditing: Boolean(subscription),
    /** Kategorie płatności cyklicznych (+ używane przez subskrypcje i wybrana) — do wyboru w polu „Kategoria”. */
    categories,
    selectCategory,
  };
}
