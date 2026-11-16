import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";
import { makeSubscriptionFormSchema } from "./schema";

const schema = makeSubscriptionFormSchema(DEFAULT_CATEGORIES);

const valid = {
  name: "  Netflix  ",
  amount: "49,99",
  categoryId: "cat-expense-subscriptions",
  period: "monthly",
  startDate: "2026-03-15",
  endDate: "",
  note: "",
};

describe("makeSubscriptionFormSchema", () => {
  it("akceptuje poprawną subskrypcję, przycina nazwę i parsuje kwotę", () => {
    const r = schema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Netflix");
      expect(r.data.amount).toBe(49.99);
      expect(r.data.endDate).toBe("");
    }
  });

  it("brak endDate w danych oznacza subskrypcję bezterminową", () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.endDate;
    const r = schema.safeParse(rest);
    expect(r.success && r.data.endDate).toBe("");
  });

  it.each(["-5", "0", "", "abc", "0,001"])("odrzuca kwotę %j", (amount) => {
    expect(schema.safeParse({ ...valid, amount }).success).toBe(false);
  });

  it("odrzuca pustą i zbyt długą nazwę", () => {
    expect(schema.safeParse({ ...valid, name: "   " }).success).toBe(false);
    expect(schema.safeParse({ ...valid, name: "x".repeat(41) }).success).toBe(false);
    expect(schema.safeParse({ ...valid, name: "x".repeat(40) }).success).toBe(true);
  });

  it("odrzuca nieistniejącą kategorię i kategorię przychodów", () => {
    expect(schema.safeParse({ ...valid, categoryId: "nope" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, categoryId: "cat-income-salary" }).success).toBe(false);
  });

  it("odrzuca niepoprawny okres i niepoprawne daty", () => {
    expect(schema.safeParse({ ...valid, period: "weekly" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, startDate: "2026-02-31" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, endDate: "2026-13-01" }).success).toBe(false);
  });

  it("endDate nie może być wcześniejsza niż startDate, ale może być równa", () => {
    expect(schema.safeParse({ ...valid, endDate: "2026-03-14" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, endDate: "2026-03-15" }).success).toBe(true);
    expect(schema.safeParse({ ...valid, endDate: "2027-03-15" }).success).toBe(true);
  });

  it("odrzuca zbyt długą notatkę", () => {
    expect(schema.safeParse({ ...valid, note: "x".repeat(201) }).success).toBe(false);
  });
});
