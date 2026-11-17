import { formatPLN, type TransactionTotals as Totals } from "@/features/transactions";
import { cn } from "@/lib/utils";

interface TransactionTotalsProps {
  totals: Totals;
  /** Gdy true, podsumowanie dotyczy tylko przefiltrowanych operacji. */
  filtered: boolean;
}

export function TransactionTotals({ totals, filtered }: TransactionTotalsProps) {
  const items = [
    { label: "Przychody", value: formatPLN(totals.income), className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Wydatki", value: formatPLN(totals.expense), className: "text-rose-600 dark:text-rose-400" },
    {
      label: "Bilans",
      value: formatPLN(totals.balance),
      className: totals.balance < 0 ? "text-rose-600 dark:text-rose-400" : "",
    },
  ];

  return (
    <section aria-label="Podsumowanie" className="rounded-xl border bg-card">
      <dl className="grid grid-cols-1 divide-y min-[420px]:grid-cols-3 min-[420px]:divide-x min-[420px]:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 px-4 py-3">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className={cn("mt-0.5 truncate text-lg font-semibold tabular-nums sm:text-xl", item.className)}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {filtered && (
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
          Podsumowanie obejmuje tylko operacje spełniające filtry.
        </p>
      )}
    </section>
  );
}
