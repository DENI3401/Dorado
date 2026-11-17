import type { Category } from "@/features/categories";
import type { PaymentOccurrence } from "@/features/subscriptions";
import { formatPLN, roundMoney } from "@/features/transactions";
import { cn } from "@/lib/utils";
import { formatDayShort } from "./monthGrid";
import { PaymentRow } from "./PaymentRow";

interface PaymentsAgendaProps {
  /** Płatności miesiąca posortowane po dacie (usePayments().occurrences). */
  occurrences: readonly PaymentOccurrence[];
  categoryById: ReadonlyMap<string, Category>;
  today: string;
}

/** Widok telefonu: zamiast siatki lista dni z płatnościami. */
export function PaymentsAgenda({ occurrences, categoryById, today }: PaymentsAgendaProps) {
  const days = new Map<string, PaymentOccurrence[]>();
  for (const occurrence of occurrences) {
    const list = days.get(occurrence.date) ?? [];
    list.push(occurrence);
    days.set(occurrence.date, list);
  }

  return (
    <ol className="grid gap-3">
      {[...days.entries()].map(([date, items]) => (
        <li key={date} className="rounded-xl border bg-card px-4 pt-3 pb-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className={cn("text-sm font-medium", date === today && "text-indigo-600 dark:text-indigo-400")}>
              {formatDayShort(date)}
              {date === today && " (dzisiaj)"}
            </h3>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatPLN(roundMoney(items.reduce((sum, o) => sum + o.amount, 0)))}
            </p>
          </div>
          <ul className="divide-y">
            {items.map((occurrence) => (
              <PaymentRow
                key={occurrence.subscriptionId}
                occurrence={occurrence}
                category={categoryById.get(occurrence.subscription.categoryId)}
              />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
