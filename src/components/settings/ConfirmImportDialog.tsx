import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { confirmImportText, confirmImportTitle, type PendingImport } from "@/features/backup";

interface ConfirmImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Zweryfikowana kopia czekająca na potwierdzenie; null, gdy nic nie czeka. */
  pending: PendingImport | null;
  onConfirm: () => void;
}

/** Potwierdzenie przed nadpisaniem danych kopią z pliku (F14). */
export function ConfirmImportDialog({ open, onOpenChange, pending, onConfirm }: ConfirmImportDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmImportTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {pending ? confirmImportText(pending.summary) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Zastąp dane
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
