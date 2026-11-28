import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";
import type { Category } from "@/features/categories/types";
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

describe("makeSubscriptionFormSchema — kategoria", () => {
  const insurance: Category = {
    id: "c-insurance",
    name: "Ubezpieczenia",
    type: "expense",
    icon: "ShieldCheck",
    color: "#22c55e",
    isDefault: false,
    forSubscriptions: true,
  };
  const categoryMessages = (input: Record<string, unknown>, categories: readonly Category[] = DEFAULT_CATEGORIES) =>
    makeSubscriptionFormSchema(categories)
      .safeParse(input)
      .error?.issues.filter((i) => i.path[0] === "categoryId")
      .map((i) => i.message);

  it("przyjmuje domyślne kategorie płatności cyklicznych", () => {
    for (const categoryId of ["cat-expense-bills", "cat-expense-housing", "cat-expense-transport", "cat-expense-health", "cat-expense-other"]) {
      expect(schema.safeParse({ ...valid, categoryId }).success).toBe(true);
    }
  });

  it("przyjmuje własną kategorię subskrypcji, gdy jest na liście kategorii", () => {
    const withCustom = makeSubscriptionFormSchema([...DEFAULT_CATEGORIES, insurance]);
    const r = withCustom.safeParse({ ...valid, categoryId: insurance.id });
    expect(r.data?.categoryId).toBe("c-insurance");
  });

  it("kategoria utworzona z formularza: przyjmuje ją dopiero schemat zbudowany z nową listą", () => {
    // Dlatego useSubscriptionForm buduje schemat od nowa przy każdej zmianie listy kategorii.
    expect(categoryMessages({ ...valid, categoryId: insurance.id })).toEqual([
      "Wybrana kategoria nie istnieje",
    ]);
    expect(categoryMessages({ ...valid, categoryId: insurance.id }, [...DEFAULT_CATEGORIES, insurance])).toBeUndefined();
  });

  it("schemat nie zawęża wyboru do listy z formularza — każda kategoria wydatków jest poprawna", () => {
    // Np. subskrypcja z kopii zapasowej w kategorii „Jedzenie” da się edytować bez zmiany kategorii.
    expect(schema.safeParse({ ...valid, categoryId: "cat-expense-food" }).success).toBe(true);
  });

  it("komunikaty błędów pola „Kategoria”", () => {
    expect(categoryMessages({ ...valid, categoryId: "" })).toContain("Wybierz kategorię");
    expect(categoryMessages({ ...valid, categoryId: "nope" })).toEqual(["Wybrana kategoria nie istnieje"]);
    expect(categoryMessages({ ...valid, categoryId: "cat-income-bonus" })).toEqual([
      "Subskrypcja wymaga kategorii wydatków",
    ]);
  });
});
