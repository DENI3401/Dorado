/**
 * Daty w danych demo są względne — liczone od dnia pierwszego uruchomienia. Dzięki temu demo
 * zawsze wygląda „świeżo”: bieżący cykl ma operacje, kalendarz ma nadchodzące płatności,
 * niezależnie od tego, kiedy ktoś pierwszy raz otworzy aplikację.
 *
 * Daty to napisy YYYY-MM-DD liczone na lokalnym kalendarzu (jak w całej aplikacji).
 */
import { addDaysIso, daysInMonth } from "@/features/subscriptions/schedule";

/** „N dni temu” — dla operacji jednorazowych (0 = dziś). */
export interface DaysAgo {
  daysAgo: number;
}

/**
 * „Dzień `day` miesiąca sprzed `monthsAgo` miesięcy” — dla subskrypcji, wynagrodzeń
 * i operacji powiązanych z nimi. Ujemne `monthsAgo` = miesiąc w przyszłości.
 */
export interface MonthDay {
  monthsAgo: number;
  day: number;
}

export type RelativeDate = DaysAgo | MonthDay;

function formatIso(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Zamienia datę względną na YYYY-MM-DD.
 *
 * Dla `MonthDay`: gdy w docelowym miesiącu nie ma takiego dnia (np. 31 listopada albo 29 lutego
 * w roku nieprzestępnym), bierzemy ten sam dzień miesiąc wcześniej. Nie przycinamy do końca
 * miesiąca, bo dzień ze `startDate` wyznacza termin każdej płatności: subskrypcja „na 31.”
 * musi zacząć się 31. dnia, żeby pokazać przypadek brzegowy z README 4.3.2.
 */
export function resolveRelativeDate(date: RelativeDate, todayIso: string): string {
  if ("daysAgo" in date) return addDaysIso(todayIso, -date.daysAgo);

  const y = Number(todayIso.slice(0, 4));
  const m = Number(todayIso.slice(5, 7));
  let index = y * 12 + (m - 1) - date.monthsAgo;
  // Dzień 29–31 istnieje najpóźniej miesiąc wcześniej (np. luty → styczeń), więc wystarczą 2 kroki.
  for (let step = 0; step < 3; step += 1, index -= 1) {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    if (date.day <= daysInMonth(year, month)) return formatIso(year, month, date.day);
  }
  throw new Error(`Nie można wyznaczyć daty: dzień ${date.day}`);
}
