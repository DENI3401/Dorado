import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatStrip } from "@/components/ui/stat-strip";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DayPaymentsDialog } from "@/components/calendar/DayPaymentsDialog";
import { PaymentsAgenda } from "@/components/calendar/PaymentsAgenda";
import {
  addMonths,
  buildMonthGrid,
  formatMonthTitle,
  monthOf,
  monthRange,
  sameMonth,
  type MonthRef,
} from "@/components/calendar/monthGrid";
import { EmptyState } from "@/components/transactions/TransactionsEmptyState";
import { useAllCategories } from "@/features/categories";
import { usePayments, useSubscriptions } from "@/features/subscriptions";
import { formatPLN, roundMoney, todayIso } from "@/features/transactions";
import { cn } from "@/lib/utils";

export default function Calendar() {
  const today = todayIso();
  const [month, setMonth] = useState<MonthRef>(() => monthOf(today));
  const { from, to } = monthRange(month);
  const { occurrences, byDate, total } = usePayments({ from, to });
  const { isEmpty: noSubscriptions } = useSubscriptions();
  const categories = useAllCategories();
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const weeks = useMemo(() => buildMonthGrid(month), [month]);

  // `open` osobno od daty, żeby treść modala nie migała podczas animacji zamykania.
  const [day, setDay] = useState<{ open: boolean; date: string | null }>({
    open: false,
    date: null,
  });

  const paidTotal = roundMoney(occurrences.filter((o) => o.paid).reduce((sum, o) => sum + o.amount, 0));
  const pendingTotal = roundMoney(total - paidTotal);
  const isCurrentMonth = sameMonth(month, monthOf(today));
  const title = formatMonthTitle(month);

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <h2 className="text-2xl font-semibold">Kalendarz płatności</h2>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Poprzedni miesiąc"
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Następny miesiąc"
          >
            <ChevronRight />
          </Button>
          <h3
            aria-live="polite"
            className="ml-2 text-xl font-semibold first-letter:uppercase"
          >
            {title}
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isCurrentMonth}
          onClick={() => setMonth(monthOf(today))}
        >
          Dziś
        </Button>
      </div>

      <StatStrip
        label={`Podsumowanie: ${title}`}
        items={[
          { label: "Suma w miesiącu", value: formatPLN(total) },
          {
            label: "Zapłacono",
            value: formatPLN(paidTotal),
            className: paidTotal > 0 ? "text-emerald-600 dark:text-emerald-400" : undefined,
          },
          { label: "Oczekuje", value: formatPLN(pendingTotal) },
        ]}
      />

      {occurrences.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Brak płatności w tym miesiącu"
          description={
            noSubscriptions
              ? "Dodaj subskrypcje, a ich terminy pojawią się w kalendarzu."
              : "Żadna aktywna subskrypcja nie ma tu terminu płatności. Sprawdź inny miesiąc albo wznów wstrzymane subskrypcje."
          }
        >
          <Link
            to="/subscriptions"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            {noSubscriptions ? "Dodaj subskrypcję" : "Przejdź do subskrypcji"}
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="hidden md:block">
            <CalendarGrid
              weeks={weeks}
              byDate={byDate}
              categoryById={categoryById}
              today={today}
              onSelectDay={(date) => setDay({ open: true, date })}
            />
          </div>
          <div className="md:hidden">
            <PaymentsAgenda occurrences={occurrences} categoryById={categoryById} today={today} />
          </div>
        </>
      )}

      <DayPaymentsDialog
        open={day.open}
        onOpenChange={(open) => setDay((prev) => ({ ...prev, open }))}
        date={day.date}
        occurrences={day.date ? (byDate[day.date] ?? []) : []}
        categoryById={categoryById}
      />
    </div>
  );
}
