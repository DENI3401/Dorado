import { useId, useMemo, useState } from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import { formatDate } from "@/components/transactions/format";
import { useAllCategories } from "@/features/categories";
import {
  RECURRING_INCOME_STATUS_LABELS,
  formatRecurringSchedule,
  pausedRecurringIncomeMessage,
  resumedRecurringIncomeMessage,
  useRecurringIncomeActions,
  useRecurringIncomes,
  type RecurringIncome,
} from "@/features/recurring-income";
import { formatPLN } from "@/features/transactions";
import { cn } from "@/lib/utils";
import { DeleteRecurringIncomeDialog } from "./DeleteRecurringIncomeDialog";

/** Lista wynagrodzeń cyklicznych (F9). Nic nie wyświetla, dopóki użytkownik żadnego nie ustawił. */
export function RecurringIncomeSection() {
  const { recurringIncomes, nextById, monthlyTotal, isEmpty } = useRecurringIncomes();
  const { setActive } = useRecurringIncomeActions();
  const categories = useAllCategories();
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const headingId = useId();

  // `open` osobno od celu, żeby tekst potwierdzenia nie znikał w trakcie animacji zamykania.
  const [deleting, setDeleting] = useState<{ open: boolean; item: RecurringIncome | null }>({
    open: false,
    item: null,
  });

  if (isEmpty) return null;

  const toggleActive = (item: RecurringIncome) => {
    const updated = setActive(item.id, !item.isActive);
    if (!updated) return;
    toast(updated.isActive ? resumedRecurringIncomeMessage(updated) : pausedRecurringIncomeMessage(updated));
  };

  return (
    <section aria-labelledby={headingId} className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 id={headingId} className="text-sm font-medium text-muted-foreground">
          Wynagrodzenia cykliczne ({recurringIncomes.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          Miesięcznie: <span className="font-medium text-foreground">{formatPLN(monthlyTotal)}</span>
        </p>
      </div>

      <ul className="divide-y rounded-xl border bg-card">
        {recurringIncomes.map((item) => {
          const category = categoryById.get(item.categoryId);
          const next = nextById[item.id];
          return (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
              <CategoryBadge icon={category?.icon ?? "Ellipsis"} color={category?.color ?? "#64748b"} />

              <div className={cn("min-w-0 flex-1", !item.isActive && "opacity-70")}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="truncate text-sm font-medium">
                    {category?.name ?? "Nieznana kategoria"}
                  </span>
                  {!item.isActive && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {RECURRING_INCOME_STATUS_LABELS.paused}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {formatRecurringSchedule(item)}
                  {next ? ` · następny wpływ: ${formatDate(next)}` : ""}
                </p>
              </div>

              <p
                className={cn(
                  "text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400",
                  !item.isActive && "opacity-70",
                )}
              >
                +{formatPLN(item.amount)}
              </p>

              <div className="flex shrink-0 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toggleActive(item)}
                  aria-label={
                    item.isActive
                      ? `Wstrzymaj wynagrodzenie cykliczne ${formatPLN(item.amount)}`
                      : `Wznów wynagrodzenie cykliczne ${formatPLN(item.amount)}`
                  }
                >
                  {item.isActive ? <Pause /> : <Play />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleting({ open: true, item })}
                  aria-label={`Usuń wynagrodzenie cykliczne ${formatPLN(item.amount)}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <DeleteRecurringIncomeDialog
        open={deleting.open}
        onOpenChange={(open) => setDeleting((prev) => ({ ...prev, open }))}
        recurringIncome={deleting.item}
      />
    </section>
  );
}
