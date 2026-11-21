import { useId } from "react";
import { PiggyBank, TriangleAlert } from "lucide-react";
import type { SafeToSpend } from "@/features/dashboard";
import { formatPLN } from "@/features/transactions";
import { cn } from "@/lib/utils";

interface SafeToSpendCardProps {
  value: SafeToSpend;
  balance: number;
  upcomingTotal: number;
  upcomingCount: number;
}

const dayWord = (n: number) => (n === 1 ? "dzień" : "dni");
const paymentWord = (n: number) => (n === 1 ? "płatność" : "płatności");

/** Karta F13: ile można bezpiecznie wydać dziennie do końca cyklu. */
export function SafeToSpendCard({ value, balance, upcomingTotal, upcomingCount }: SafeToSpendCardProps) {
  const headingId = useId();
  const { perDay, available, daysLeft, isShortfall } = value;

  const details = [
    {
      label: "Saldo cyklu",
      value: formatPLN(balance),
      className: balance < 0 ? "text-rose-600 dark:text-rose-400" : undefined,
    },
    {
      label: "Nadchodzące płatności",
      value: formatPLN(upcomingTotal),
      hint: upcomingCount > 0 ? `${upcomingCount} ${paymentWord(upcomingCount)} subskrypcji` : "brak do końca cyklu",
    },
    {
      label: "Do końca cyklu",
      value: `${daysLeft} ${dayWord(daysLeft)}`,
      hint: daysLeft === 1 ? "ostatni dzień cyklu" : "z dzisiejszym",
    },
  ];

  return (
    <section aria-labelledby={headingId} className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
        >
          <PiggyBank className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 id={headingId} className="text-sm text-muted-foreground">
            Bezpiecznie do wydania dziennie
          </h3>
          <p aria-live="polite" className="text-3xl font-semibold tabular-nums break-words">
            {formatPLN(perDay)}
            <span className="ml-1 text-base font-normal text-muted-foreground">/ dzień</span>
          </p>
        </div>
      </div>

      {isShortfall && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Saldo nie pokrywa nadchodzących płatności — brakuje {formatPLN(-available)}. Wstrzymaj
            wydatki do końca cyklu albo dodaj przychód.
          </span>
        </p>
      )}

      <dl className="grid grid-cols-1 gap-3 border-t pt-3 min-[420px]:grid-cols-3">
        {details.map((d) => (
          <div key={d.label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{d.label}</dt>
            <dd className={cn("truncate font-medium tabular-nums", d.className)}>{d.value}</dd>
            {d.hint && <dd className="truncate text-xs text-muted-foreground">{d.hint}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
