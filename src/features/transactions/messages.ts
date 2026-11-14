import type { IncomeKind, Transaction, TransactionType } from "./types";
import type { TransactionSavedEvent } from "./hooks/useTransactionForm";
import { formatPLN } from "./utils/money";

/** Etykiety do selectów, filtrów i tabeli. */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: "Przychód",
  expense: "Wydatek",
};

export const INCOME_KIND_LABELS: Record<IncomeKind, string> = {
  salary: "Wynagrodzenie stałe",
  bonus: "Premia / dochód dodatkowy",
};

const noun = (t: Transaction) => (t.type === "income" ? "przychód" : "wydatek");

/** Gotowe teksty do Toastów (UI tylko je wyświetla). */
export function savedTransactionMessage(event: TransactionSavedEvent): string {
  const { transaction: t } = event;
  const verb = event.action === "created" ? "Dodano" : "Zapisano zmiany:";
  return `${verb} ${noun(t)} ${formatPLN(t.amount)}`;
}

export function removedTransactionMessage(t: Transaction): string {
  return `Usunięto ${noun(t)} ${formatPLN(t.amount)}`;
}

/** Tekst do modalu potwierdzenia usunięcia. */
export function confirmRemoveTransactionText(t: Transaction): string {
  return `Czy na pewno usunąć ${noun(t)} ${formatPLN(t.amount)} z dnia ${t.date}?`;
}
