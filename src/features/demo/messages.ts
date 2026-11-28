import { plural } from "@/features/backup/messages";
import type { DemoCounts } from "./build";

export const DEMO_TITLES = {
  section: "Dane demonstracyjne",
  clearButton: "Wyczyść dane demo",
  confirm: "Wyczyścić dane demo?",
  banner: "Przeglądasz dane przykładowe",
} as const;

export const DEMO_DESCRIPTIONS = {
  section:
    "Przy pierwszym uruchomieniu Dorado wczytuje przykładowe przychody, wydatki, subskrypcje i kategorie, żeby od razu było widać, jak działa aplikacja. Gdy zaczniesz wpisywać własne dane, usuń przykłady jednym przyciskiem.",
  banner: "Możesz je dowolnie zmieniać, a gdy zaczniesz wpisywać własne dane — usunąć jednym przyciskiem.",
} as const;

export const restoredDemoMessage = "Przywrócono dane demo";

/** „97 transakcji, 9 subskrypcji, 2 wynagrodzenia stałe i 3 kategorie własne” (pomija zera). */
export function demoContentsText(counts: DemoCounts): string {
  const parts = [
    counts.transactions > 0 && plural(counts.transactions, "transakcja", "transakcje", "transakcji"),
    counts.subscriptions > 0 && plural(counts.subscriptions, "subskrypcja", "subskrypcje", "subskrypcji"),
    counts.recurringIncomes > 0 &&
      plural(counts.recurringIncomes, "wynagrodzenie stałe", "wynagrodzenia stałe", "wynagrodzeń stałych"),
    counts.customCategories > 0 &&
      plural(counts.customCategories, "kategoria własna", "kategorie własne", "kategorii własnych"),
  ].filter((part): part is string => typeof part === "string");
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} i ${parts[parts.length - 1]}`;
}

/** Treść okna potwierdzenia przed usunięciem danych demo. */
export function confirmClearDemoText(counts: DemoCounts): string {
  return `Usuniemy przykładowe dane: ${demoContentsText(counts)}. Twoje własne operacje zostaną — jeśli używają kategorii demo, trafią do kategorii „Inne”.`;
}

/** Toast po usunięciu danych demo. */
export function clearedDemoMessage(reassigned: number): string {
  return reassigned > 0
    ? `Usunięto dane demo. Przeniesiono do kategorii „Inne”: ${plural(reassigned, "Twój rekord", "Twoje rekordy", "Twoich rekordów")}`
    : "Usunięto dane demo";
}
