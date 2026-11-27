import type { z } from "zod";
import type { BackupSummary } from "./backup";

export const BACKUP_TITLES = {
  section: "Kopia zapasowa",
  export: "Eksportuj do JSON",
  import: "Importuj z JSON",
} as const;

export const BACKUP_DESCRIPTIONS = {
  section:
    "Pobierz wszystkie dane (transakcje, kategorie, subskrypcje i ustawienia) do pliku .json albo wczytaj je z wcześniej zapisanej kopii.",
  importHint: "Import zastępuje obecne dane — przed wczytaniem poprosimy o potwierdzenie.",
} as const;

export const invalidJsonMessage = "Plik nie jest poprawnym plikiem JSON";
export const tooLargeFileMessage = "Plik jest zbyt duży, aby był kopią zapasową Dorado";
export const readFileErrorMessage = "Nie udało się odczytać pliku";
export const invalidBackupTitle = "Nie wczytano kopii zapasowej";
export const exportErrorMessage = "Nie udało się zapisać kopii zapasowej";
export const restoredBeforeImportMessage = "Przywrócono dane sprzed importu";
export const confirmImportTitle = "Zastąpić obecne dane?";

/** Odmiana rzeczownika po liczebniku: 1 transakcja, 2 transakcje, 5 transakcji. */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return `${n} ${one}`;
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  const isFew = lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14);
  return `${n} ${isFew ? few : many}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "short",
  timeStyle: "short",
});

/** ISO timestamp → „27.11.2026, 14:05” (czas lokalny). */
export function formatExportedAt(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** „120 transakcji, 3 kategorie własne, 4 subskrypcje i 1 wynagrodzenie stałe” */
export function backupContentsText(summary: BackupSummary): string {
  const parts = [
    plural(summary.transactions, "transakcja", "transakcje", "transakcji"),
    plural(summary.customCategories, "kategoria własna", "kategorie własne", "kategorii własnych"),
    plural(summary.subscriptions, "subskrypcja", "subskrypcje", "subskrypcji"),
    plural(summary.recurringIncomes, "wynagrodzenie stałe", "wynagrodzenia stałe", "wynagrodzeń stałych"),
  ];
  return `${parts.slice(0, -1).join(", ")} i ${parts[parts.length - 1]}`;
}

/** Treść okna potwierdzenia przed nadpisaniem danych. */
export function confirmImportText(summary: BackupSummary): string {
  return `Kopia z ${formatExportedAt(summary.exportedAt)} zawiera: ${backupContentsText(summary)}. Wszystkie obecne dane (transakcje, kategorie, subskrypcje, wynagrodzenia i ustawienia) zostaną zastąpione.`;
}

export function exportedMessage(fileName: string): string {
  return `Zapisano kopię zapasową: ${fileName}`;
}

export function importedMessage(summary: BackupSummary): string {
  return `Wczytano kopię zapasową z ${formatExportedAt(summary.exportedAt)}`;
}

const SECTION_LABELS: Record<string, string> = {
  data: "Dane kopii",
  transactions: "Transakcje",
  customCategories: "Kategorie własne",
  subscriptions: "Subskrypcje",
  recurringIncomes: "Wynagrodzenia stałe",
  settings: "Ustawienia",
  alerts: "Alert niskiego salda",
  subscriptionSync: "Synchronizacja subskrypcji",
};

const FIELD_LABELS: Record<string, string> = {
  id: "identyfikator",
  type: "typ",
  incomeKind: "rodzaj przychodu",
  amount: "kwota",
  categoryId: "kategoria",
  date: "data",
  note: "notatka",
  createdAt: "data utworzenia",
  subscriptionId: "subskrypcja",
  recurringIncomeId: "wynagrodzenie stałe",
  name: "nazwa",
  icon: "ikona",
  color: "kolor",
  isDefault: "kategoria domyślna",
  period: "okres",
  startDate: "data rozpoczęcia",
  endDate: "data zakończenia",
  isActive: "aktywna",
  generatedThrough: "rozliczone do",
  cycleStartDay: "dzień początku cyklu",
  lowBalanceThreshold: "próg alertu",
  lowBalanceAlertTriggered: "flaga alertu",
  alertCycleStart: "cykl alertu",
};

/**
 * Błąd Zod → zdanie dla użytkownika, np.
 * „Transakcje, pozycja 3, pole „kwota”: Kwota musi być większa od zera”.
 */
export function describeIssue(issue: z.core.$ZodIssue): string {
  // Pola nagłówka (app, version, exportedAt) mają własne, pełne komunikaty.
  if (issue.path[0] !== "data") return issue.message;
  const path = issue.path.slice(1);
  if (path.length === 0) return `${SECTION_LABELS.data}: ${issue.message}`;

  const [section, ...rest] = path;
  const parts = [SECTION_LABELS[String(section)] ?? String(section)];
  for (const key of rest) {
    if (typeof key === "number") parts.push(`pozycja ${key + 1}`);
    else parts.push(`pole „${FIELD_LABELS[String(key)] ?? String(key)}”`);
  }
  return `${parts.join(", ")}: ${issue.message}`;
}
