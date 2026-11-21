import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";
import type { Category } from "@/features/categories/types";
import { categoriesForIncomeKind } from "./incomeKindCategories";

const income = DEFAULT_CATEGORIES.filter((c) => c.type === "income");
const expense = DEFAULT_CATEGORIES.filter((c) => c.type === "expense");
const names = (list: readonly Category[]) => list.map((c) => c.name);

const custom: Category = {
  id: "custom-1",
  name: "Korepetycje",
  type: "income",
  icon: "BookOpen",
  color: "#6366f1",
  isDefault: false,
};

describe("categoriesForIncomeKind", () => {
  it("wynagrodzenie stałe: tylko Wynagrodzenie", () => {
    expect(names(categoriesForIncomeKind(income, "salary"))).toEqual(["Wynagrodzenie"]);
  });

  it("premia / dochód dodatkowy: tylko Premia i Inne przychody", () => {
    expect(names(categoriesForIncomeKind(income, "bonus"))).toEqual(["Premia", "Inne przychody"]);
  });

  it("własna kategoria przychodu jest dostępna przy obu rodzajach", () => {
    expect(names(categoriesForIncomeKind([...income, custom], "salary"))).toEqual([
      "Wynagrodzenie",
      "Korepetycje",
    ]);
    expect(names(categoriesForIncomeKind([...income, custom], "bonus"))).toContain("Korepetycje");
  });

  it("bez rodzaju przychodu niczego nie ukrywa", () => {
    expect(categoriesForIncomeKind(income, undefined).length).toBe(income.length);
    expect(categoriesForIncomeKind(income, null).length).toBe(income.length);
  });

  it("nie rusza kategorii wydatków", () => {
    expect(categoriesForIncomeKind(expense, "salary").length).toBe(expense.length);
  });
});
