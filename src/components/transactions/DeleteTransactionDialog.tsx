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
  confirmRemoveTransactionText,
  removedTransactionMessage,
  useTransactionActions,
  type Transaction,
} from "@/features/transactions";

interface DeleteTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

/** Potwierdzenie usunięcia; po zatwierdzeniu Toast z przyciskiem „Cofnij”. */
export function DeleteTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: DeleteTransactionDialogProps) {
  const { remove } = useTransactionActions();

  const confirm = () => {
    if (!transaction) return;
    const removed = remove(transaction.id);
    onOpenChange(false);
    if (removed) {
      toast(removedTransactionMessage(removed.transaction), {
        duration: 8000,
        action: { label: "Cofnij", onClick: removed.undo },
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć operację?</AlertDialogTitle>
          <AlertDialogDescription>
            {transaction ? confirmRemoveTransactionText(transaction) : null}
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
