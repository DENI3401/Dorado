import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CATEGORY_COLORS } from "../defaultCategories";
import {
  makeCategoryFormSchema,
  type CategoryFormInput,
  type CategoryFormValues,
} from "../schema";
import { useCategoriesStore } from "../store";
import type { Category } from "../types";
import { useAllCategories } from "./useAllCategories";

export type CategorySavedEvent =
  | { action: "created"; category: Category }
  | { action: "updated"; category: Category };

interface Options {
  /** Przekaż, aby edytować istniejącą własną kategorię. */
  category?: Category;
  /**
   * Nowa kategoria z formularza subskrypcji: zawsze wydatek (typ zablokowany)
   * i od razu dostępna w subskrypcjach.
   */
  forSubscriptions?: boolean;
  /** Wywoływane po zapisie — tu UI pokazuje Toast i zamyka modal. */
  onSaved?: (event: CategorySavedEvent) => void;
}

const emptyDefaults: CategoryFormInput = {
  name: "",
  type: "expense",
  icon: "Ellipsis",
  color: CATEGORY_COLORS[5],
  forSubscriptions: false,
};

function fromCategory(category: Category): CategoryFormInput {
  return {
    name: category.name,
    type: category.type,
    icon: category.icon as CategoryFormInput["icon"],
    color: category.color,
    forSubscriptions: category.forSubscriptions === true,
  };
}

/** Bezgłowa logika formularza kategorii (bez żadnego JSX). */
export function useCategoryForm({ category, forSubscriptions = false, onSaved }: Options = {}) {
  const all = useAllCategories();
  const addCategory = useCategoriesStore((s) => s.addCategory);
  const updateCategory = useCategoriesStore((s) => s.updateCategory);

  const schema = useMemo(() => makeCategoryFormSchema(all, category), [all, category]);

  const startValues: CategoryFormInput = forSubscriptions
    ? { ...emptyDefaults, type: "expense", forSubscriptions: true }
    : emptyDefaults;

  const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: category ? fromCategory(category) : startValues,
  });

  const submit = form.handleSubmit((values) => {
    if (category) {
      const updated = updateCategory(category.id, values);
      if (updated) onSaved?.({ action: "updated", category: updated });
      return;
    }
    const created = addCategory(forSubscriptions ? { ...values, forSubscriptions: true } : values);
    onSaved?.({ action: "created", category: created });
    form.reset({ ...startValues, type: values.type });
  });

  return {
    form,
    submit,
    isEditing: Boolean(category),
    /** true przy edycji i w formularzu subskrypcji — pole "typ" powinno być wyłączone lub ukryte. */
    typeLocked: Boolean(category) || forSubscriptions,
    /** Kategoria powstaje z formularza subskrypcji (typ i flaga ustalone z góry). */
    forSubscriptions: !category && forSubscriptions,
  };
}
