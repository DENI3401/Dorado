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
  confirmRemoveSubscriptionText,
  removedSubscriptionMessage,
  useSubscriptionActions,
  type Subscription,
} from "@/features/subscriptions";

interface DeleteSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
}

/** Potwierdzenie usunięcia; po zatwierdzeniu Toast z przyciskiem „Cofnij”. */
export function DeleteSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
}: DeleteSubscriptionDialogProps) {
  const { remove } = useSubscriptionActions();

  const confirm = () => {
    if (!subscription) return;
    const removed = remove(subscription.id);
    onOpenChange(false);
    if (removed) {
      toast(removedSubscriptionMessage(removed.subscription), {
        duration: 8000,
        action: { label: "Cofnij", onClick: removed.undo },
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć subskrypcję?</AlertDialogTitle>
          <AlertDialogDescription>
            {subscription ? confirmRemoveSubscriptionText(subscription) : null}
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
