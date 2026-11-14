import type { Transaction } from "./types";
import type { TransactionFormValues } from "./schema";

export function createTransaction(
  values: TransactionFormValues,
  now: Date = new Date(),
): Transaction {
  return {
    id: crypto.randomUUID(),
    type: values.type,
    incomeKind: values.type === "income" ? (values.incomeKind ?? "bonus") : null,
    amount: values.amount,
    categoryId: values.categoryId,
    date: values.date,
    note: values.note,
    createdAt: now.toISOString(),
  };
}

/** Nakłada wartości z formularza na istniejącą operację (id i createdAt zostają). */
export function applyValues(
  transaction: Transaction,
  values: TransactionFormValues,
): Transaction {
  return {
    ...transaction,
    type: values.type,
    incomeKind: values.type === "income" ? (values.incomeKind ?? "bonus") : null,
    amount: values.amount,
    categoryId: values.categoryId,
    date: values.date,
    note: values.note,
  };
}
