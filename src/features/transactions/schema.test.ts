import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";
import { makeTransactionFormSchema } from "./schema";

const schema = makeTransactionFormSchema(DEFAULT_CATEGORIES);

const valid = {
  type: "expense",
  amount: "25,50",
  categoryId: "cat-expense-food",
  date: "2026-11-03",
  note: "  obiad  ",
};

describe("makeTransactionFormSchema", () => {
  it("akceptuje poprawny wydatek, parsuje kwotę i przycina notatkę", () => {
    const r = schema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.amount).toBe(25.5);
      expect(r.data.note).toBe("obiad");
    }
  });

  it("zaokrągla kwotę do 2 miejsc", () => {
    const r = schema.safeParse({ ...valid, amount: "10.456" });
    expect(r.success && r.data.amount).toBe(10.46);
  });

  it.each(["-5", "0", "0,001", "abc", "", "2000000000"])("odrzuca kwotę %j", (amount) => {
    expect(schema.safeParse({ ...valid, amount }).success).toBe(false);
  });

  it("odrzuca nieistniejącą datę", () => {
    expect(schema.safeParse({ ...valid, date: "2026-02-31" }).success).toBe(false);
  });

  it("wymaga rodzaju przychodu dla przychodu", () => {
    const income = { ...valid, type: "income", categoryId: "cat-income-salary" };
    expect(schema.safeParse(income).success).toBe(false);
    expect(schema.safeParse({ ...income, incomeKind: "salary" }).success).toBe(true);
  });

  it("odrzuca kategorię niepasującą do typu lub nieistniejącą", () => {
    expect(schema.safeParse({ ...valid, categoryId: "cat-income-salary" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, categoryId: "nope" }).success).toBe(false);
  });

  describe("cykliczność (F9)", () => {
    const salary = {
      ...valid,
      type: "income",
      incomeKind: "salary",
      categoryId: "cat-income-salary",
    };

    it("akceptuje recurring dla wynagrodzenia stałego", () => {
      expect(schema.safeParse({ ...salary, recurring: true }).success).toBe(true);
    });

    it("odrzuca recurring dla premii", () => {
      const r = schema.safeParse({ ...salary, incomeKind: "bonus", recurring: true });
      expect(r.success).toBe(false);
    });

    it("odrzuca recurring dla wydatku", () => {
      expect(schema.safeParse({ ...valid, recurring: true }).success).toBe(false);
    });

    it("recurring: false lub brak pola jest zawsze w porządku", () => {
      expect(schema.safeParse({ ...valid, recurring: false }).success).toBe(true);
      expect(schema.safeParse(salary).success).toBe(true);
    });
  });
});
