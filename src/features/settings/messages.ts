import type { DateRange } from "@/features/budget-cycle";
import { formatPLN } from "@/features/transactions/utils/money";

/** "2026-11-15" → "15.11" */
function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
}

/** Zakres cyklu w formacie z ustawień: "15.11–14.12". */
export function formatCycleRange(range: DateRange): string {
  return `${shortDate(range.start)}–${shortDate(range.end)}`;
}

export const SETTINGS_TITLES = {
  page: "Ustawienia",
  cycle: "Cykl budżetowy",
  lowBalance: "Alert niskiego salda",
} as const;

export const SETTINGS_DESCRIPTIONS = {
  cycle: "Cykl budżetowy to okres, w którym liczysz swoje saldo, np. od dnia wypłaty.",
  lowBalance: "Ostrzeżemy Cię, gdy saldo cyklu spadnie poniżej tej kwoty.",
} as const;

export const SETTINGS_HINTS = {
  cycleStartDay: "Jeśli miesiąc jest krótszy, cykl zaczyna się ostatniego dnia miesiąca",
  lowBalanceThreshold: "0 = alert wyłączony",
} as const;

/** „Bieżący cykl: 15.11–14.12, saldo otwarcia: 700,00 zł” — podgląd na żywo. */
export function currentCycleMessage(range: DateRange, opening: number): string {
  return `Bieżący cykl: ${formatCycleRange(range)}, saldo otwarcia: ${formatPLN(opening)}`;
}

/** Status progu względem salda cyklu (pod polem progu). */
export function thresholdStatusMessage(options: {
  threshold: number;
  isBelow: boolean;
}): string {
  if (options.threshold <= 0) return "Alert jest wyłączony.";
  return options.isBelow
    ? "Saldo jest niższe niż próg — alert pojawi się od razu po zapisaniu."
    : "Saldo jest powyżej progu — alert nie zadziała.";
}

export const confirmCycleChangeTitle = "Zmienić początek cyklu?";

/** Tekst potwierdzenia zmiany dnia cyklu (edge case 4.3.1 z README). */
export function confirmCycleChangeText(newRange: DateRange): string {
  return `Nowy cykl: ${formatCycleRange(newRange)}. Historia transakcji się nie zmieni, saldo otwarcia zostanie przeliczone.`;
}

export const savedSettingsMessage = "Zapisano ustawienia";
export const restoredSettingsMessage = "Przywrócono poprzednie ustawienia";
