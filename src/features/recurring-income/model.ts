import type { NewRecurringIncome, RecurringIncome } from "./types";

export function createRecurringIncome(
  values: NewRecurringIncome,
  now: Date = new Date(),
): RecurringIncome {
  return {
    id: crypto.randomUUID(),
    amount: values.amount,
    categoryId: values.categoryId,
    period: "monthly",
    startDate: values.startDate,
    endDate: null,
    isActive: true,
    note: values.note,
    createdAt: now.toISOString(),
    generatedThrough: null,
  };
}
