import { useCallback, useState } from "react";
import { downloadTextFile } from "@/lib/downloadFile";
import {
  backupFileName,
  createBackup,
  parseBackup,
  restoreBackup,
  serializeBackup,
  summarizeBackup,
  type BackupSummary,
} from "../backup";
import { readFileErrorMessage } from "../messages";
import type { BackupFile } from "../schema";

/** Kopia wczytana z pliku i zweryfikowana — czeka na potwierdzenie nadpisania. */
export interface PendingImport {
  backup: BackupFile;
  summary: BackupSummary;
  fileName: string;
}

/** Zdarzenie po imporcie: UI pokazuje Toast z „Cofnij” (previous = stan sprzed importu). */
export interface BackupImportedEvent {
  summary: BackupSummary;
  previous: BackupFile;
}

/** Odrzucony plik: komunikat główny + lista wszystkich problemów. */
export interface BackupImportError {
  fileName: string;
  message: string;
  details: string[];
}

interface Options {
  onExported?: (fileName: string) => void;
  onExportFailed?: () => void;
  onImported?: (event: BackupImportedEvent) => void;
  onRejected?: (error: BackupImportError) => void;
}

/** Bezgłowa logika eksportu i importu kopii zapasowej (bez JSX). */
export function useBackup({ onExported, onExportFailed, onImported, onRejected }: Options = {}) {
  // `pending` zostaje po zamknięciu okna (treść nie miga w trakcie animacji),
  // o widoczności decyduje `confirmOpen`.
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<BackupImportError | null>(null);
  const [reading, setReading] = useState(false);

  const exportBackup = useCallback(() => {
    const now = new Date();
    const fileName = backupFileName(now);
    try {
      downloadTextFile(serializeBackup(createBackup(now)), fileName);
      onExported?.(fileName);
    } catch {
      onExportFailed?.();
    }
  }, [onExported, onExportFailed]);

  /** Czyta i weryfikuje plik. Niczego nie zapisuje — poprawny plik otwiera potwierdzenie. */
  const selectFile = useCallback(
    async (file: File) => {
      setError(null);
      setReading(true);
      let text: string;
      try {
        text = await file.text();
      } catch {
        const rejected = { fileName: file.name, message: readFileErrorMessage, details: [] };
        setError(rejected);
        onRejected?.(rejected);
        return;
      } finally {
        setReading(false);
      }

      const result = parseBackup(text);
      if (!result.success) {
        const rejected = { fileName: file.name, message: result.error, details: result.details };
        setError(rejected);
        onRejected?.(rejected);
        return;
      }
      setPending({ backup: result.backup, summary: summarizeBackup(result.backup), fileName: file.name });
      setConfirmOpen(true);
    },
    [onRejected],
  );

  /** Użytkownik potwierdził nadpisanie danych. */
  const confirmImport = useCallback(() => {
    setConfirmOpen(false);
    if (!pending) return;
    const previous = createBackup();
    restoreBackup(pending.backup.data);
    onImported?.({ summary: pending.summary, previous });
  }, [onImported, pending]);

  /** Użytkownik zrezygnował — dane zostają bez zmian. */
  const cancelImport = useCallback(() => setConfirmOpen(false), []);

  /** Cofnięcie importu (Undo z toastu): przywraca stan sprzed wczytania pliku. */
  const undoImport = useCallback((event: BackupImportedEvent) => {
    restoreBackup(event.previous.data);
  }, []);

  return {
    exportBackup,
    selectFile,
    reading,
    pending,
    confirmOpen,
    confirmImport,
    cancelImport,
    undoImport,
    /** Ostatni odrzucony plik (null = brak błędu). */
    error,
    clearError: () => setError(null),
  };
}
