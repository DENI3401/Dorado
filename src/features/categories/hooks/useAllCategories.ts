import { useMemo } from "react";
import { DEFAULT_CATEGORIES } from "../defaultCategories";
import { useCategoriesStore } from "../store";
import type { Category } from "../types";

/** Kategorie domyślne + własne (stabilna referencja między renderami). */
export function useAllCategories(): Category[] {
  const custom = useCategoriesStore((s) => s.customCategories);
  return useMemo(() => [...DEFAULT_CATEGORIES, ...custom], [custom]);
}
