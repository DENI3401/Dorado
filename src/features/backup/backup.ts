import { z } from "zod";
import { useAlertStore } from "@/features/alerts/store";
import { useCategoriesStore } from "@/features/categories/store";
import { useRecurringIncomeStore } from "@/features/recurring-income/store";
import { useSettingsStore } from "@/features/settings/store";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import { useTransactionsStore } from "@/features/transactions/store";
import { readSyncedThrough, writeSyncedThrough } from "@/lib/subscriptionSyncStorage";
import {
  BACKUP_APP,
  BACKUP_VERSION,
  backupFileSchema,
  type BackupData,
  type BackupFile,
} from "./schema";
import { describeIssue, invalidJsonMessage, tooLargeFileMessage } from "./messages";

/** Górna granica rozmiaru pliku — chroni przed przypadkowym wczytaniem czegoś ogromnego. */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

/** Zbiera cały stan aplikacji z magazynów (to samo, co trafia do localStorage). */
export function collectBackupData(): BackupData {
  const { cycleStartDay, lowBalanceThreshold } = useSettingsStore.getState();
  const { lowBalanceAlertTriggered, alertCycleStart } = useAlertStore.getState();
  return {
    transactions: useTransactionsStore.getState().transactions,
    customCategories: useCategoriesStore.getState().customCategories,
    subscriptions: useSubscriptionsStore.getState().subscriptions,
    recurringIncomes: useRecurringIncomeStore.getState().recurringIncomes,
    settings: { cycleStartDay, lowBalanceThreshold },
    alerts: { lowBalanceAlertTriggered, alertCycleStart },
    subscriptionSync: readSyncedThrough(),
  };
}

export function createBackup(now: Date = new Date()): BackupFile {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data: collectBackupData(),
  };
}

export function serializeBackup(backup: BackupFile): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

/** „dorado-kopia-2026-11-27.json” — data lokalna, żeby zgadzała się z kalendarzem użytkownika. */
export function backupFileName(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `dorado-kopia-${y}-${m}-${d}.json`;
}

export type ParseBackupResult =
  | { success: true; backup: BackupFile }
  | { success: false; error: string; details: string[] };

// Nagłówek sprawdzamy po kolei: dla obcego pliku wystarczy jeden komunikat zamiast setek błędów pól.
const headerChecks = [
  backupFileSchema.pick({ app: true }),
  backupFileSchema.pick({ version: true }),
] as const;

/**
 * Zamienia tekst pliku na zweryfikowaną kopię. Nic nie zapisuje — przy błędzie zwraca
 * komunikat dla użytkownika (pierwszy problem) i listę wszystkich problemów.
 */
export function parseBackup(text: string): ParseBackupResult {
  if (text.length > MAX_BACKUP_BYTES) {
    return { success: false, error: tooLargeFileMessage, details: [] };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { success: false, error: invalidJsonMessage, details: [] };
  }

  const options = { error: z.locales.pl().localeError };

  for (const check of headerChecks) {
    const header = check.safeParse(json, options);
    if (!header.success) {
      const messages = header.error.issues.map(describeIssue);
      return { success: false, error: messages[0], details: messages };
    }
  }

  const result = backupFileSchema.safeParse(json, options);
  if (!result.success) {
    const messages = result.error.issues.map(describeIssue);
    return { success: false, error: messages[0], details: messages };
  }
  return { success: true, backup: result.data };
}

/**
 * Zastępuje cały stan aplikacji danymi z kopii.
 *
 * Kolejność ma znaczenie, bo inne części aplikacji nasłuchują zmian w magazynach:
 * - znacznik synchronizacji subskrypcji, ustawienia i flaga alertu idą najpierw — sprawdzenie
 *   salda po zmianie transakcji widzi już próg i cykl z kopii;
 * - kategorie przed transakcjami, żeby UI nie trafił na operację z nieznaną kategorią;
 * - wynagrodzenia i subskrypcje na końcu — ich synchronizacja patrzy już na odtworzoną historię
 *   i nie dopisze duplikatów.
 */
export function restoreBackup(data: BackupData): void {
  writeSyncedThrough(data.subscriptionSync);
  useSettingsStore.setState({
    cycleStartDay: data.settings.cycleStartDay,
    lowBalanceThreshold: data.settings.lowBalanceThreshold,
  });
  useAlertStore.setState({
    lowBalanceAlertTriggered: data.alerts.lowBalanceAlertTriggered,
    alertCycleStart: data.alerts.alertCycleStart,
  });
  useCategoriesStore.setState({ customCategories: data.customCategories });
  useTransactionsStore.setState({ transactions: data.transactions });
  useRecurringIncomeStore.setState({ recurringIncomes: data.recurringIncomes });
  useSubscriptionsStore.setState({ subscriptions: data.subscriptions });
}

/** Krótkie podsumowanie zawartości kopii (do okna potwierdzenia). */
export interface BackupSummary {
  exportedAt: string;
  transactions: number;
  customCategories: number;
  subscriptions: number;
  recurringIncomes: number;
}

export function summarizeBackup(backup: BackupFile): BackupSummary {
  return {
    exportedAt: backup.exportedAt,
    transactions: backup.data.transactions.length,
    customCategories: backup.data.customCategories.length,
    subscriptions: backup.data.subscriptions.length,
    recurringIncomes: backup.data.recurringIncomes.length,
  };
}
