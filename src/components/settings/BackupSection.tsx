import { useRef, type ChangeEvent } from "react";
import { Download, TriangleAlert, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  BACKUP_DESCRIPTIONS,
  BACKUP_TITLES,
  exportErrorMessage,
  exportedMessage,
  importedMessage,
  invalidBackupTitle,
  restoredBeforeImportMessage,
  useBackup,
} from "@/features/backup";
import { ConfirmImportDialog } from "./ConfirmImportDialog";
import { SettingsSection } from "./SettingsSection";

/** Ile szczegółowych problemów pokazać pod komunikatem o odrzuconym pliku. */
const MAX_DETAILS = 5;

/** Sekcja „Kopia zapasowa” w ustawieniach: eksport i import całego stanu do / z pliku JSON (F14). */
export function BackupSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backup = useBackup({
    onExported: (fileName) => toast.success(exportedMessage(fileName)),
    onExportFailed: () => toast.error(exportErrorMessage),
    onRejected: (error) => toast.error(invalidBackupTitle, { description: error.message }),
    onImported: (event) => {
      toast.success(importedMessage(event.summary), {
        duration: 10_000,
        action: {
          label: "Cofnij",
          onClick: () => {
            backup.undoImport(event);
            toast(restoredBeforeImportMessage);
          },
        },
      });
    },
  });
  const { error } = backup;

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Czyścimy pole, żeby ponowny wybór tego samego pliku (np. po poprawce) też zadziałał.
    event.target.value = "";
    if (file) void backup.selectFile(file);
  };

  const hiddenDetails = error ? Math.max(0, error.details.length - 1 - MAX_DETAILS) : 0;

  return (
    <SettingsSection title={BACKUP_TITLES.section} description={BACKUP_DESCRIPTIONS.section}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="lg" onClick={backup.exportBackup}>
          <Download aria-hidden="true" />
          {BACKUP_TITLES.export}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={backup.reading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload aria-hidden="true" />
          {BACKUP_TITLES.import}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onFileChange}
        />
      </div>
      <p className="text-xs text-muted-foreground">{BACKUP_DESCRIPTIONS.importHint}</p>

      {error && (
        <div
          role="alert"
          className="grid gap-1 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm"
        >
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <div className="grid min-w-0 flex-1 gap-1">
              <p className="font-medium text-destructive">
                {invalidBackupTitle}: <span className="break-all">{error.fileName}</span>
              </p>
              <p>{error.message}</p>
              {error.details.length > 1 && (
                <ul className="list-disc pl-5 text-xs text-muted-foreground">
                  {error.details.slice(1, 1 + MAX_DETAILS).map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                  {hiddenDetails > 0 && <li>…i {hiddenDetails} więcej</li>}
                </ul>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Zamknij komunikat"
              onClick={backup.clearError}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmImportDialog
        open={backup.confirmOpen}
        onOpenChange={(open) => {
          if (!open) backup.cancelImport();
        }}
        pending={backup.pending}
        onConfirm={backup.confirmImport}
      />
    </SettingsSection>
  );
}
