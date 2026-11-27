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
import type { DateRange } from "@/features/budget-cycle";
import { confirmCycleChangeText, confirmCycleChangeTitle } from "@/features/settings";

interface ConfirmCycleChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cykl, który zacznie obowiązywać po zmianie dnia; null, gdy nic nie czeka na potwierdzenie. */
  newRange: DateRange | null;
  onConfirm: () => void;
}

/** Potwierdzenie zmiany dnia początku cyklu (edge case 4.3.1 z README). */
export function ConfirmCycleChangeDialog({
  open,
  onOpenChange,
  newRange,
  onConfirm,
}: ConfirmCycleChangeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmCycleChangeTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {newRange ? confirmCycleChangeText(newRange) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction className="bg-indigo-600 text-white hover:bg-indigo-500" onClick={onConfirm}>
            Zmień cykl
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
