import { toast } from "sonner";
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
import {
  confirmRemoveRecurringIncomeText,
  removedRecurringIncomeMessage,
  useRecurringIncomeActions,
  type RecurringIncome,
} from "@/features/recurring-income";

interface DeleteRecurringIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringIncome: RecurringIncome | null;
}

/** Potwierdzenie usunięcia; po zatwierdzeniu Toast z przyciskiem „Cofnij”. */
export function DeleteRecurringIncomeDialog({
  open,
  onOpenChange,
  recurringIncome,
}: DeleteRecurringIncomeDialogProps) {
  const { remove } = useRecurringIncomeActions();

  const confirm = () => {
    if (!recurringIncome) return;
    const removed = remove(recurringIncome.id);
    onOpenChange(false);
    if (removed) {
      toast(removedRecurringIncomeMessage(removed.recurringIncome), {
        duration: 8000,
        action: { label: "Cofnij", onClick: removed.undo },
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć wynagrodzenie cykliczne?</AlertDialogTitle>
          <AlertDialogDescription>
            {recurringIncome ? confirmRemoveRecurringIncomeText(recurringIncome) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm}>
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
