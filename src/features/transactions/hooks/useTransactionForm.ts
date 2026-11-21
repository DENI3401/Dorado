import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAllCategories } from "@/features/categories/hooks/useAllCategories";
import { useRecurringIncomeStore } from "@/features/recurring-income/store";
import { syncRecurringIncome } from "@/features/recurring-income/sync";
import type { RecurringIncome } from "@/features/recurring-income/types";
import {
  makeTransactionFormSchema,
  type TransactionFormInput,
  type TransactionFormValues,
} from "../schema";
import { useTransactionsStore } from "../store";
import type { Transaction, TransactionType } from "../types";
import { formatPLN } from "../utils/money";
import { todayIso } from "../utils/isoDate";

export type TransactionSavedEvent =
  | { action: "created"; transaction: Transaction }
  | { action: "updated"; transaction: Transaction }
  /** Wynagrodzenie cykliczne (F9): powstała reguła, a `booked` wpływów trafiło już do historii. */
  | { action: "recurring-created"; recurringIncome: RecurringIncome; booked: number };

interface Options {
  /** Przekaż, aby edytować istniejącą operację. */
  transaction?: Transaction;
  defaultType?: TransactionType;
  /** Wywoływane po zapisie — tu UI pokazuje Toast i zamyka modal. */
  onSaved?: (event: TransactionSavedEvent) => void;
}

function emptyDefaults(type: TransactionType): TransactionFormInput {
  return {
    type,
    incomeKind: type === "income" ? "bonus" : undefined,
    recurring: false,
    amount: "",
    categoryId: "",
    date: todayIso(),
    note: "",
  };
}

function fromTransaction(t: Transaction): TransactionFormInput {
  return {
    type: t.type,
    incomeKind: t.incomeKind ?? undefined,
    amount: String(t.amount),
    categoryId: t.categoryId,
    date: t.date,
    note: t.note,
  };
}

/** Bezgłowa logika formularza przychodu / wydatku (bez żadnego JSX). */
export function useTransactionForm({ transaction, defaultType = "expense", onSaved }: Options = {}) {
  const categories = useAllCategories();
  const addTransaction = useTransactionsStore((s) => s.addTransaction);
  const updateTransaction = useTransactionsStore((s) => s.updateTransaction);
  const addRecurringIncome = useRecurringIncomeStore((s) => s.addRecurringIncome);

  const schema = useMemo(() => makeTransactionFormSchema(categories), [categories]);

  const form = useForm<TransactionFormInput, unknown, TransactionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: transaction ? fromTransaction(transaction) : emptyDefaults(defaultType),
  });

  const type = useWatch({ control: form.control, name: "type" });
  const incomeKind = useWatch({ control: form.control, name: "incomeKind" });
  const recurring = useWatch({ control: form.control, name: "recurring" }) ?? false;
  // Cykliczność dotyczy tylko NOWEGO wynagrodzenia stałego (edycja pojedynczej operacji jej nie zmienia).
  const canRepeat = !transaction && type === "income" && incomeKind === "salary";

  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  // Zmiana typu (przychód <-> wydatek): czyści niepasującą kategorię i rodzaj przychodu.
  useEffect(() => {
    const { categoryId, incomeKind } = form.getValues();
    if (categoryId && !categoriesForType.some((c) => c.id === categoryId)) {
      form.setValue("categoryId", "");
    }
    if (type === "income" && !incomeKind) form.setValue("incomeKind", "bonus");
    if (type === "expense" && incomeKind) form.setValue("incomeKind", undefined);
  }, [type, categoriesForType, form]);

  // Zmiana typu lub rodzaju przychodu wyłącza „cyklicznie”, gdy przestaje być dozwolone.
  useEffect(() => {
    if (!canRepeat && form.getValues("recurring")) form.setValue("recurring", false);
  }, [canRepeat, form]);

  const submit = form.handleSubmit((values) => {
    if (transaction) {
      const updated = updateTransaction(transaction.id, values);
      if (updated) onSaved?.({ action: "updated", transaction: updated });
      return;
    }
    if (values.recurring) {
      const recurringIncome = addRecurringIncome({
        amount: values.amount,
        categoryId: values.categoryId,
        startDate: values.date,
        note: values.note,
      });
      // Wpływy z przeszłości księgujemy od razu (AppLayout robi to też po każdej zmianie magazynu).
      syncRecurringIncome();
      const booked = useTransactionsStore
        .getState()
        .transactions.filter((t) => t.recurringIncomeId === recurringIncome.id).length;
      onSaved?.({ action: "recurring-created", recurringIncome, booked });
      form.reset(emptyDefaults(values.type));
      return;
    }
    const created = addTransaction(values);
    onSaved?.({ action: "created", transaction: created });
    form.reset(emptyDefaults(values.type));
  });

  return {
    form,
    submit,
    isEditing: Boolean(transaction),
    type,
    /** Czy w formularzu można wybrać „cyklicznie” (nowe wynagrodzenie stałe). */
    canRepeat,
    /** Czy wybrano księgowanie cykliczne. */
    recurring,
    /** Kategorie pasujące do aktualnie wybranego typu — do pola select. */
    categories: categoriesForType,
    formatAmount: formatPLN,
  };
}
