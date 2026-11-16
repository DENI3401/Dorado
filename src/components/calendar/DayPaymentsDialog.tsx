import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category } from "@/features/categories";
import type { PaymentOccurrence } from "@/features/subscriptions";
import { formatPLN, roundMoney } from "@/features/transactions";
import { cn } from "@/lib/utils";
import { formatDayLong } from "./monthGrid";
import { PaymentRow } from "./PaymentRow";

interface DayPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** YYYY-MM-DD; null, gdy nic nie wybrano. */
  date: string | null;
  occurrences: readonly PaymentOccurrence[];
  categoryById: ReadonlyMap<string, Category>;
}

/** Pełna lista płatności wybranego dnia (komórka kalendarza pokazuje tylko kilka). */
export function DayPaymentsDialog({
  open,
  onOpenChange,
  date,
  occurrences,
  categoryById,
}: DayPaymentsDialogProps) {
  const total = roundMoney(occurrences.reduce((sum, o) => sum + o.amount, 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{date ? formatDayLong(date) : "Płatności"}</DialogTitle>
          <DialogDescription>Suma tego dnia: {formatPLN(total)}</DialogDescription>
        </DialogHeader>

        <ul className="max-h-[50vh] divide-y overflow-y-auto">
          {occurrences.map((occurrence) => (
            <PaymentRow
              key={occurrence.subscriptionId}
              occurrence={occurrence}
              category={categoryById.get(occurrence.subscription.categoryId)}
            />
          ))}
        </ul>

        <DialogFooter>
          <Link
            to="/subscriptions"
            className={cn(buttonVariants({ variant: "outline" }))}
            onClick={() => onOpenChange(false)}
          >
            Zarządzaj subskrypcjami
          </Link>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Zamknij
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
