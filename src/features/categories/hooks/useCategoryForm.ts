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
  /** Wywoływane po zapisie — tu UI pokazuje Toast i zamyka modal. */
  onSaved?: (event: CategorySavedEvent) => void;
}

const emptyDefaults: CategoryFormInput = {
  name: "",
  type: "expense",
  icon: "Ellipsis",
  color: CATEGORY_COLORS[5],
};

/** Bezgłowa logika formularza kategorii (bez żadnego JSX). */
export function useCategoryForm({ category, onSaved }: Options = {}) {
  const all = useAllCategories();
  const addCategory = useCategoriesStore((s) => s.addCategory);
  const updateCategory = useCategoriesStore((s) => s.updateCategory);

  const schema = useMemo(() => makeCategoryFormSchema(all, category), [all, category]);

  const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: category
      ? { name: category.name, type: category.type, icon: category.icon as CategoryFormInput["icon"], color: category.color }
      : emptyDefaults,
  });

  const submit = form.handleSubmit((values) => {
    if (category) {
      const updated = updateCategory(category.id, values);
      if (updated) onSaved?.({ action: "updated", category: updated });
      return;
    }
    const created = addCategory(values);
    onSaved?.({ action: "created", category: created });
    form.reset({ ...emptyDefaults, type: values.type });
  });

  return {
    form,
    submit,
    isEditing: Boolean(category),
    /** true przy edycji — pole "typ" powinno być wyłączone (disabled). */
    typeLocked: Boolean(category),
  };
}
