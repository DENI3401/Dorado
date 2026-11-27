// Publiczne API modułu kopii zapasowej (F14) — importuj stąd: import { ... } from "@/features/backup";
export {
  BACKUP_APP,
  BACKUP_VERSION,
  backupFileSchema,
  backupDataSchema,
  type BackupData,
  type BackupFile,
} from "./schema";
export {
  MAX_BACKUP_BYTES,
  backupFileName,
  collectBackupData,
  createBackup,
  parseBackup,
  restoreBackup,
  serializeBackup,
  summarizeBackup,
  type BackupSummary,
  type ParseBackupResult,
} from "./backup";
export {
  useBackup,
  type BackupImportError,
  type BackupImportedEvent,
  type PendingImport,
} from "./hooks/useBackup";
export * from "./messages";
