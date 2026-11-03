import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "./defaultCategories";
import { makeCategoryFormSchema } from "./schema";
import type { Category } from "./types";

const base = { name: "Siłownia", type: "expense", icon: "Dumbbell", color: "#22c55e" };

describe("makeCategoryFormSchema", () => {
  it("akceptuje poprawną kategorię i normalizuje spacje", () => {
    const r = makeCategoryFormSchema(DEFAULT_CATEGORIES).safeParse({ ...base, name: "  Moja   siłownia " });
    expect(r.success && r.data.name).toBe("Moja siłownia");
  });

  it("odrzuca duplikat bez względu na wielkość liter (też względem domyślnych)", () => {
    const schema = makeCategoryFormSchema(DEFAULT_CATEGORIES);
    expect(schema.safeParse({ ...base, name: "jedzenie" }).success).toBe(false);
  });

  it("pozwala na tę samą nazwę w innym typie", () => {
    const schema = makeCategoryFormSchema(DEFAULT_CATEGORIES);
    expect(schema.safeParse({ ...base, name: "Premia", type: "expense" }).success).toBe(true);
  });

  it("odrzuca zbyt krótką nazwę, zły kolor i nieznaną ikonę", () => {
    const schema = makeCategoryFormSchema(DEFAULT_CATEGORIES);
    expect(schema.safeParse({ ...base, name: "A" }).success).toBe(false);
    expect(schema.safeParse({ ...base, color: "red" }).success).toBe(false);
    expect(schema.safeParse({ ...base, icon: "Nope" }).success).toBe(false);
  });

  it("przy edycji nie koliduje sama ze sobą, ale blokuje zmianę typu", () => {
    const mine: Category = { id: "x", name: "Siłownia", type: "expense", icon: "Dumbbell", color: "#22c55e", isDefault: false };
    const schema = makeCategoryFormSchema([...DEFAULT_CATEGORIES, mine], mine);
    expect(schema.safeParse(base).success).toBe(true);
    expect(schema.safeParse({ ...base, type: "income" }).success).toBe(false);
  });
});
