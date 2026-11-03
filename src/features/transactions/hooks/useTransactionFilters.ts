import { useCallback, useMemo, useState } from "react";
import { useAllCategories } from "@/features/categories/hooks/useAllCategories";
import {
  DEFAULT_FILTERS,
  filterTransactions,
  hasActiveFilters,
  summarize,
  type TransactionFilters,
} from "../filters";
import { useTransactionsStore } from "../store";

/** Stan filtrów historii + gotowa przefiltrowana lista i podsumowanie. */
export function useTransactionFilters() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const categories = useAllCategories();
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);

  const setFilter = useCallback(
    <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const results = useMemo(
    () => filterTransactions(transactions, filters, categories),
    [transactions, filters, categories],
  );
  const totals = useMemo(() => summarize(results), [results]);

  return {
    filters,
    setFilter,
    reset,
    results,
    totals,
    isFiltering: hasActiveFilters(filters),
    /** true, gdy w ogóle nie ma operacji (Empty State) — inne niż "brak wyników filtra". */
    isEmpty: transactions.length === 0,
  };
}
