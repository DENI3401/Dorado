import { useMemo, useState } from "react";
import { Plus, Tags } from "lucide-react";
import { CategoriesDialog } from "@/components/categories/CategoriesDialog";
import { Button } from "@/components/ui/button";
import { DeleteTransactionDialog } from "@/components/transactions/DeleteTransactionDialog";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionFormDialog } from "@/components/transactions/TransactionFormDialog";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { TransactionTotals } from "@/components/transactions/TransactionTotals";
import {
  NoResultsState,
  NoTransactionsState,
} from "@/components/transactions/TransactionsEmptyState";
import { useAllCategories } from "@/features/categories";
import {
  useTransactionFilters,
  type Transaction,
  type TransactionType,
} from "@/features/transactions";

interface FormTarget {
  open: boolean;
  transaction?: Transaction;
  type: TransactionType;
}

export default function Transactions() {
  const { filters, setFilter, reset, results, totals, isFiltering, isEmpty } =
    useTransactionFilters();
  const categories = useAllCategories();
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // `open` osobno od reszty, żeby treść modala nie migała podczas animacji zamykania.
  const [form, setForm] = useState<FormTarget>({ open: false, type: "expense" });
  const openCreate = (type: TransactionType) => setForm({ open: true, type });
  const openEdit = (transaction: Transaction) =>
    setForm({ open: true, transaction, type: transaction.type });

  // Tak samo jak formularz: `open` osobno, by tekst potwierdzenia nie znikał w trakcie animacji.
  const [deleting, setDeleting] = useState<{ open: boolean; transaction: Transaction | null }>({
    open: false,
    transaction: null,
  });
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const askDelete = (transaction: Transaction) => setDeleting({ open: true, transaction });

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Transakcje</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="lg" onClick={() => setCategoriesOpen(true)}>
            <Tags /> Kategorie
          </Button>
          <Button variant="outline" size="lg" onClick={() => openCreate("income")}>
            <Plus /> Przychód
          </Button>
          <Button
            size="lg"
            className="bg-indigo-600 text-white hover:bg-indigo-500"
            onClick={() => openCreate("expense")}
          >
            <Plus /> Wydatek
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <NoTransactionsState>
          <Button
            size="lg"
            className="bg-indigo-600 text-white hover:bg-indigo-500"
            onClick={() => openCreate("expense")}
          >
            <Plus /> Dodaj pierwszą operację
          </Button>
        </NoTransactionsState>
      ) : (
        <>
          <TransactionTotals totals={totals} filtered={isFiltering} />
          <TransactionFilters
            filters={filters}
            setFilter={setFilter}
            reset={reset}
            isFiltering={isFiltering}
          />

          {results.length === 0 ? (
            <NoResultsState>
              <Button variant="outline" onClick={reset}>
                Wyczyść filtry
              </Button>
            </NoResultsState>
          ) : (
            <section aria-label="Lista operacji" className="grid gap-2">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Liczba operacji: {results.length}
              </p>
              <ul className="divide-y rounded-xl border bg-card">
                {results.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    category={categoryById.get(t.categoryId)}
                    onEdit={openEdit}
                    onDelete={askDelete}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <TransactionFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((prev) => ({ ...prev, open }))}
        transaction={form.transaction}
        defaultType={form.type}
      />

      <CategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />

      <DeleteTransactionDialog
        open={deleting.open}
        onOpenChange={(open) => setDeleting((prev) => ({ ...prev, open }))}
        transaction={deleting.transaction}
      />
    </div>
  );
}
