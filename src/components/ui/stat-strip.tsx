import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  value: string;
  /** Dodatkowe klasy wartości, np. kolor. */
  className?: string;
}

interface StatStripProps {
  items: readonly Stat[];
  label: string;
  footnote?: string;
}

const COLUMNS: Record<number, string> = {
  2: "min-[420px]:grid-cols-2",
  3: "min-[420px]:grid-cols-3",
};

/** Pasek 2–3 podsumowań (jak na liście transakcji): etykieta nad wartością, kolumny rozdzielone linią. */
export function StatStrip({ items, label, footnote }: StatStripProps) {
  return (
    <section aria-label={label} className="rounded-xl border bg-card">
      {/* Na bardzo wąskich ekranach (<420 px) wartości układają się jedna pod drugą, żeby kwoty się nie ucinały. */}
      <dl
        className={cn(
          "grid grid-cols-1 divide-y min-[420px]:divide-x min-[420px]:divide-y-0",
          COLUMNS[items.length],
        )}
      >
        {items.map((item) => (
          <div key={item.label} className="min-w-0 px-4 py-3">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd
              className={cn(
                "mt-0.5 truncate text-lg font-semibold tabular-nums sm:text-xl",
                item.className,
              )}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {footnote && <p className="border-t px-4 py-2 text-xs text-muted-foreground">{footnote}</p>}
    </section>
  );
}
