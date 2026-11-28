import { useState } from "react";
import { Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DEMO_TITLES,
  clearedDemoMessage,
  confirmClearDemoText,
  restoredDemoMessage,
  useDemoData,
  type DemoCounts,
} from "@/features/demo";

interface ClearDemoDataButtonProps {
  size?: "default" | "lg";
}

/** Przycisk „Wyczyść dane demo” z potwierdzeniem; po usunięciu Toast z przyciskiem „Cofnij” (F15). */
export function ClearDemoDataButton({ size = "lg" }: ClearDemoDataButtonProps) {
  const { counts, clear, undo } = useDemoData();
  const [open, setOpen] = useState(false);
  // Liczby z chwili otwarcia — tekst nie zmienia się (nie miga) w trakcie animacji zamykania.
  const [snapshot, setSnapshot] = useState<DemoCounts>(counts);

  const confirm = () => {
    setOpen(false);
    const result = clear();
    if (!result) return;
    toast.success(clearedDemoMessage(result.reassigned), {
      duration: 10_000,
      action: {
        label: "Cofnij",
        onClick: () => {
          undo(result);
          toast(restoredDemoMessage);
        },
      },
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => {
          setSnapshot(counts);
          setOpen(true);
        }}
      >
        <Trash2 aria-hidden="true" />
        {DEMO_TITLES.clearButton}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{DEMO_TITLES.confirm}</AlertDialogTitle>
            <AlertDialogDescription>{confirmClearDemoText(snapshot)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirm}>
              {DEMO_TITLES.clearButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
