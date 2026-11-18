import { Link } from "react-router-dom";
import { ChartColumn } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatStrip } from "@/components/ui/stat-strip";
import { CashflowChart } from "@/components/dashboard/CashflowChart";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { SafeToSpendCard } from "@/components/dashboard/SafeToSpendCard";
import { formatDate } from "@/components/transactions/format";
import { EmptyState } from "@/components/transactions/TransactionsEmptyState";
import { useDashboard, useToday } from "@/features/dashboard";
import { formatPLN } from "@/features/transactions";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const today = useToday();
  const {
    cycle,
    totals,
    balance,
    daily,
    expensesByCategory,
    incomeByCategory,
    upcoming,
    safeToSpend,
    isEmpty,
  } = useDashboard(today);
  const cycleLabel = `${formatDate(cycle.start)} – ${formatDate(cycle.end)}`;

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <div className="grid gap-1">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Bieżący cykl: {cycleLabel}</p>
      </div>

      <StatStrip
        label={`Podsumowanie cyklu ${cycleLabel}`}
        items={[
          { label: "Przychody", value: formatPLN(totals.income), className: "text-emerald-600 dark:text-emerald-400" },
          { label: "Wydatki", value: formatPLN(totals.expense), className: "text-rose-600 dark:text-rose-400" },
          {
            label: "Saldo",
            value: formatPLN(balance),
            className: balance < 0 ? "text-rose-600 dark:text-rose-400" : undefined,
          },
        ]}
      />

      <SafeToSpendCard
        value={safeToSpend}
        balance={balance}
        upcomingTotal={upcoming.total}
        upcomingCount={upcoming.occurrences.length}
      />

      {isEmpty ? (
        <EmptyState
          icon={ChartColumn}
          title="Brak operacji w tym cyklu"
          description="Dodaj przychód lub wydatek z datą z bieżącego cyklu, a pojawią się tu wykresy."
        >
          <Link to="/transactions" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Przejdź do transakcji
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="min-w-0 lg:col-span-2">
            <CashflowChart data={daily} />
          </div>
          <div className="min-w-0">
            <CategoryBreakdownChart type="expense" slices={expensesByCategory} total={totals.expense} />
          </div>
          <div className="min-w-0">
            <CategoryBreakdownChart type="income" slices={incomeByCategory} total={totals.income} />
          </div>
        </div>
      )}
    </div>
  );
}
