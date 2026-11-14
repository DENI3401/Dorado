import type { Category } from "./types";

/** Ikony dostępne w kreatorze kategorii (nazwy z lucide-react). */
export const CATEGORY_ICONS = [
  "Utensils",
  "Car",
  "House",
  "Receipt",
  "Clapperboard",
  "HeartPulse",
  "ShoppingBag",
  "Repeat",
  "Ellipsis",
  "Wallet",
  "Gift",
  "Laptop",
  "PiggyBank",
  "Plane",
  "GraduationCap",
  "Dumbbell",
  "Gamepad2",
  "Coffee",
  "PawPrint",
  "Smartphone",
  "Shirt",
  "BookOpen",
  "Music",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#64748b",
] as const;

/** Kategorie używane jako zapas, gdy usuwana jest kategoria z przypisanymi operacjami. */
export const FALLBACK_CATEGORY_ID = {
  expense: "cat-expense-other",
  income: "cat-income-other",
} as const;

export const SUBSCRIPTIONS_CATEGORY_ID = "cat-expense-subscriptions";

export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: "cat-expense-food", name: "Jedzenie", type: "expense", icon: "Utensils", color: "#f97316", isDefault: true },
  { id: "cat-expense-transport", name: "Transport", type: "expense", icon: "Car", color: "#3b82f6", isDefault: true },
  { id: "cat-expense-housing", name: "Mieszkanie", type: "expense", icon: "House", color: "#6366f1", isDefault: true },
  { id: "cat-expense-bills", name: "Rachunki", type: "expense", icon: "Receipt", color: "#eab308", isDefault: true },
  { id: "cat-expense-entertainment", name: "Rozrywka", type: "expense", icon: "Clapperboard", color: "#a855f7", isDefault: true },
  { id: "cat-expense-health", name: "Zdrowie", type: "expense", icon: "HeartPulse", color: "#ef4444", isDefault: true },
  { id: "cat-expense-shopping", name: "Zakupy", type: "expense", icon: "ShoppingBag", color: "#ec4899", isDefault: true },
  { id: SUBSCRIPTIONS_CATEGORY_ID, name: "Subskrypcje", type: "expense", icon: "Repeat", color: "#14b8a6", isDefault: true },
  { id: FALLBACK_CATEGORY_ID.expense, name: "Inne wydatki", type: "expense", icon: "Ellipsis", color: "#64748b", isDefault: true },
  { id: "cat-income-salary", name: "Wynagrodzenie", type: "income", icon: "Wallet", color: "#22c55e", isDefault: true },
  { id: "cat-income-bonus", name: "Premia", type: "income", icon: "Gift", color: "#14b8a6", isDefault: true },
  { id: "cat-income-freelance", name: "Freelance", type: "income", icon: "Laptop", color: "#3b82f6", isDefault: true },
  { id: FALLBACK_CATEGORY_ID.income, name: "Inne przychody", type: "income", icon: "PiggyBank", color: "#64748b", isDefault: true },
];
