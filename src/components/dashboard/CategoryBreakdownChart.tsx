import { useId } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from "recharts";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import type { CategorySlice } from "@/features/dashboard";
import { formatPLN } from "@/features/transactions";
import type { TransactionType } from "@/features/transactions/types";
import { cn } from "@/lib/utils";

const percent = new Intl.NumberFormat("pl-PL", { style: "percent", maximumFractionDigits: 1 });

function CategoryTooltip({ active, payload }: TooltipContentProps) {
  const slice = payload?.[0]?.payload as CategorySlice | undefined;
  if (!active || !slice) return null;
  return (
    <div className="grid gap-0.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="flex items-center gap-2 font-medium">
        <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ backgroundColor: slice.color }} />
        {slice.name}
      </p>
      <p className="tabular-nums">
        {formatPLN(slice.amount)} <span className="text-muted-foreground">· {percent.format(slice.share)}</span>
      </p>
    </div>
  );
}

/** Teksty karty zależne od typu operacji — wygląd karty jest wspólny. */
const COPY: Record<TransactionType, { title: string; listLabel: string; empty: string }> = {
  expense: {
    title: "Wydatki wg kategorii",
    listLabel: "Udział kategorii w wydatkach",
    empty: "Brak wydatków w tym cyklu.",
  },
  income: {
    title: "Przychody wg kategorii",
    listLabel: "Udział kategorii w przychodach",
    empty: "Brak przychodów w tym cyklu.",
  },
};

/**
 * Miejsce tooltipa — nigdy na sumie „Razem” w środku koła. Wąski telefon: u góry koła, nad sumą
 * (z boku nie ma miejsca, a nad kołem zasłaniałby tytuł karty); od `sm`: z prawej strony koła; od `lg` karty
 * stoją obok siebie (wydatki po lewej, przychody po prawej), więc tooltip kieruje się w stronę sąsiedniej
 * karty, żeby nie wychodził poza ekran.
 */
const TOOLTIP_BASE =
  "[&_.recharts-tooltip-wrapper]:top-1! [&_.recharts-tooltip-wrapper]:left-1/2! [&_.recharts-tooltip-wrapper]:-translate-x-1/2 sm:[&_.recharts-tooltip-wrapper]:top-1/2! sm:[&_.recharts-tooltip-wrapper]:left-[calc(100%+0.5rem)]! sm:[&_.recharts-tooltip-wrapper]:translate-x-0 sm:[&_.recharts-tooltip-wrapper]:-translate-y-1/2";
const TOOLTIP_PLACEMENT: Record<TransactionType, string> = {
  expense: TOOLTIP_BASE,
  income: `${TOOLTIP_BASE} lg:[&_.recharts-tooltip-wrapper]:left-auto! lg:[&_.recharts-tooltip-wrapper]:right-[calc(100%+0.5rem)]`,
};

interface CategoryBreakdownChartProps {
  /** Typ operacji, których dotyczy karta: wydatki albo przychody. */
  type: TransactionType;
  slices: readonly CategorySlice[];
  total: number;
}

/** Wykres kołowy (donut) wydatków albo przychodów wg kategorii + legenda z kwotami i udziałami. */
export function CategoryBreakdownChart({ type, slices, total }: CategoryBreakdownChartProps) {
  const headingId = useId();
  const copy = COPY[type];
  // Recharts koloruje wycinek z pola `fill` w danych (Cell jest w v3 przestarzały).
  const data = slices.map((s) => ({ ...s, fill: s.color }));

  return (
    <section aria-labelledby={headingId} className="grid min-w-0 content-start gap-3 rounded-xl border bg-card p-4">
      <h3 id={headingId} className="font-medium">
        {copy.title}
      </h3>

      {slices.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {copy.empty}
        </p>
      ) : (
        <div className="grid items-center gap-4 sm:grid-cols-[12rem_1fr] lg:grid-cols-1">
          <div aria-hidden="true" className={cn("relative mx-auto size-48", TOOLTIP_PLACEMENT[type])}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="100%"
                  stroke="var(--card)"
                  strokeWidth={2}
                  // Animacja wycinków w Recharts 3 potrafi zostawić pusty donut (sprawdzone w Chrome) — wyłączona.
                  isAnimationActive={false}
                />
                <Tooltip
                  content={CategoryTooltip}
                  // Bez podążania za kursorem — miejsce ustala TOOLTIP_PLACEMENT; z-10: zawsze nad sumą „Razem”.
                  wrapperStyle={{ transform: "none", zIndex: 10, width: "max-content" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground">Razem</span>
              <span className="max-w-28 truncate text-sm font-semibold tabular-nums">{formatPLN(total)}</span>
            </div>
          </div>

          <ul className="grid gap-2" aria-label={copy.listLabel}>
            {slices.map((s) => (
              <li key={s.categoryId} className="flex min-w-0 items-center gap-3">
                <CategoryBadge icon={s.icon} color={s.color} className="size-8" />
                <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                <span className="text-right text-sm tabular-nums">
                  <span className="font-medium">{formatPLN(s.amount)}</span>
                  <span className="block text-xs text-muted-foreground">{percent.format(s.share)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
