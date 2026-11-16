/** Miesiąc w kalendarzu: month to 1–12. */
export interface MonthRef {
  year: number;
  month: number;
}

export interface GridCell {
  /** YYYY-MM-DD */
  iso: string;
  day: number;
  /** false dla dni sąsiednich miesięcy, które tylko dopełniają tydzień. */
  inMonth: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toIso(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
}

export function monthOf(iso: string): MonthRef {
  return { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) };
}

export function sameMonth(a: MonthRef, b: MonthRef): boolean {
  return a.year === b.year && a.month === b.month;
}

export function addMonths({ year, month }: MonthRef, delta: number): MonthRef {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Pierwszy i ostatni dzień miesiąca — przedział dla usePayments({ from, to }). */
export function monthRange({ year, month }: MonthRef): { from: string; to: string } {
  return { from: toIso(year, month, 1), to: toIso(year, month, daysInMonth(year, month)) };
}

/**
 * Tygodnie (od poniedziałku) pokrywające miesiąc. Dni spoza miesiąca mają
 * inMonth: false i służą tylko do wyrównania siatki.
 */
export function buildMonthGrid({ year, month }: MonthRef): GridCell[][] {
  const lead = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const weeks = Math.ceil((lead + daysInMonth(year, month)) / 7);
  const rows: GridCell[][] = [];
  for (let w = 0; w < weeks; w += 1) {
    const row: GridCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(year, month - 1, 1 - lead + w * 7 + d);
      row.push({
        iso: toIso(date.getFullYear(), date.getMonth() + 1, date.getDate()),
        day: date.getDate(),
        inMonth: date.getMonth() === month - 1,
      });
    }
    rows.push(row);
  }
  return rows;
}

const monthTitle = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" });
const dayLong = new Intl.DateTimeFormat("pl-PL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dayShort = new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "short" });

/** „listopad 2026” */
export function formatMonthTitle({ year, month }: MonthRef): string {
  return monthTitle.format(new Date(year, month - 1, 1));
}

function localDate(iso: string): Date {
  return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

/** „wtorek, 3 listopada 2026” */
export function formatDayLong(iso: string): string {
  return dayLong.format(localDate(iso));
}

/** „wt., 3 lis” */
export function formatDayShort(iso: string): string {
  return dayShort.format(localDate(iso));
}

/** Skróty dni tygodnia w kolejności siatki (poniedziałek pierwszy). */
export const WEEKDAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"] as const;
