import { Pencil, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import {
  INCOME_KIND_LABELS,
  formatPLN,
  type Transaction,
} from "@/features/transactions";
import type { Category } from "@/features/categories";
import { cn } from "@/lib/utils";
import { formatDate } from "./format";

interface TransactionRowProps {
  transaction: Transaction;
  /** Kategoria operacji; undefined tylko przy niespójnych danych. */
  category?: Category;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionRow({ transaction: t, category, onEdit, onDelete }: TransactionRowProps) {
  const isIncome = t.type === "income";
  const name = category?.name ?? "Nieznana kategoria";

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
      <CategoryBadge icon={category?.icon ?? "Ellipsis"} color={category?.color ?? "#64748b"} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate text-sm font-medium">{name}</span>
          {t.incomeKind && (
            <span className="hidden rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">
              {INCOME_KIND_LABELS[t.incomeKind]}
            </span>
          )}
          {t.subscriptionId && (
            <Repeat
              className="size-3.5 text-muted-foreground"
              aria-label="Operacja z subskrypcji"
            />
          )}
        </div>
        {t.note && <p className="truncate text-sm text-muted-foreground">{t.note}</p>}
      </div>

      <div className="text-right">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
          )}
        >
          {isIncome ? "+" : "−"}
          {formatPLN(t.amount)}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
      </div>

      <div className="flex shrink-0 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(t)}
          aria-label={`Edytuj operację: ${name} ${formatPLN(t.amount)}`}
        >
          <Pencil />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(t)}
          aria-label={`Usuń operację: ${name} ${formatPLN(t.amount)}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
