import { Check } from "lucide-react";
import type { Category } from "@/features/categories";
import type { PaymentOccurrence } from "@/features/subscriptions";
import { formatPLN, roundMoney } from "@/features/transactions";
import { cn } from "@/lib/utils";
import { WEEKDAY_LABELS, formatDayLong, type GridCell } from "./monthGrid";

const MAX_CHIPS = 2;

interface CalendarGridProps {
  weeks: readonly (readonly GridCell[])[];
  byDate: Readonly<Record<string, PaymentOccurrence[] | undefined>>;
  categoryById: ReadonlyMap<string, Category>;
  /** Dzisiejsza data (YYYY-MM-DD) — jej numer jest wyróżniony. */
  today: string;
  onSelectDay: (iso: string) => void;
}

function paymentsLabel(count: number): string {
  return count === 1 ? "1 płatność" : `${count} płatności`;
}

/** Siatka miesiąca (od poniedziałku). Dni z płatnościami są przyciskami otwierającymi listę dnia. */
export function CalendarGrid({ weeks, byDate, categoryById, today, onSelectDay }: CalendarGridProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            {WEEKDAY_LABELS.map((label) => (
              <th
                key={label}
                scope="col"
                className="border-b px-2 py-2 text-left text-xs font-medium text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0].iso}>
              {week.map((cell) => {
                const payments = cell.inMonth ? (byDate[cell.iso] ?? []) : [];
                const isToday = cell.iso === today;
                const number = (
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      isToday ? "bg-indigo-600 font-semibold text-white" : "text-muted-foreground",
                    )}
                  >
                    {cell.day}
                  </span>
                );

                return (
                  <td
                    key={cell.iso}
                    className={cn(
                      "h-28 border-t border-l p-0 align-top first:border-l-0",
                      !cell.inMonth && "bg-muted/30",
                    )}
                  >
                    {!cell.inMonth ? (
                      <div className="p-1.5 opacity-40">{number}</div>
                    ) : payments.length === 0 ? (
                      <div className="p-1.5">{number}</div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectDay(cell.iso)}
                        aria-label={`${formatDayLong(cell.iso)}: ${paymentsLabel(payments.length)}, razem ${formatPLN(
                          roundMoney(payments.reduce((sum, p) => sum + p.amount, 0)),
                        )}`}
                        className="flex h-full w-full flex-col items-start gap-1 p-1.5 text-left outline-none transition hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                      >
                        {number}
                        <span className="grid w-full gap-0.5">
                          {payments.slice(0, MAX_CHIPS).map((p) => {
                            const color = categoryById.get(p.subscription.categoryId)?.color ?? "#64748b";
                            return (
                              <span
                                key={p.subscriptionId}
                                className="flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-xs"
                                style={{ backgroundColor: `${color}1f` }}
                              >
                                <span
                                  aria-hidden="true"
                                  className="size-1.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="truncate">{p.subscription.name}</span>
                                {p.paid && (
                                  <Check
                                    className="ml-auto size-3 shrink-0 text-emerald-600 dark:text-emerald-400"
                                    aria-hidden="true"
                                  />
                                )}
                              </span>
                            );
                          })}
                          {payments.length > MAX_CHIPS && (
                            <span className="px-1 text-xs text-muted-foreground">
                              +{payments.length - MAX_CHIPS} więcej
                            </span>
                          )}
                        </span>
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
