import { Pause, Pencil, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import { formatDate } from "@/components/transactions/format";
import type { Category } from "@/features/categories";
import {
  SUBSCRIPTION_STATUS_LABELS,
  formatSubscriptionCost,
  type Subscription,
  type SubscriptionStatus,
} from "@/features/subscriptions";
import { cn } from "@/lib/utils";
import { describeRelativeDay } from "./nextPayment";

interface SubscriptionCardProps {
  subscription: Subscription;
  /** Kategoria subskrypcji; undefined tylko przy niespójnych danych. */
  category?: Category;
  status: SubscriptionStatus;
  /** Data najbliższej płatności z useSubscriptions().nextPaymentById; null dla wstrzymanych i zakończonych. */
  nextPayment: string | null;
  today: string;
  onEdit: (subscription: Subscription) => void;
  onToggleActive: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
}

export function SubscriptionCard({
  subscription: s,
  category,
  status,
  nextPayment,
  today,
  onEdit,
  onToggleActive,
  onDelete,
}: SubscriptionCardProps) {
  const dimmed = status !== "active";

  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-4",
        status === "paused" && "border-dashed bg-transparent",
        status === "ended" && "bg-muted/40",
      )}
    >
      <div className={cn("flex items-start gap-3", dimmed && "opacity-70")}>
        <CategoryBadge icon={category?.icon ?? "Ellipsis"} color={category?.color ?? "#64748b"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h3 className="truncate font-medium">{s.name}</h3>
            {dimmed && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {SUBSCRIPTION_STATUS_LABELS[status]}
              </span>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {category?.name ?? "Nieznana kategoria"}
          </p>
        </div>
        <p className="text-right font-semibold tabular-nums">{formatSubscriptionCost(s)}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className={cn("grid gap-0.5 text-sm", dimmed && "opacity-70")}>
          <p>
            <span className="text-muted-foreground">Następna płatność: </span>
            {nextPayment ? (
              <>
                <span className="font-medium">{formatDate(nextPayment)}</span>{" "}
                <span className="text-muted-foreground">({describeRelativeDay(nextPayment, today)})</span>
              </>
            ) : (
              <span aria-label="brak">—</span>
            )}
          </p>
          {s.endDate && (
            <p className="text-muted-foreground">
              {status === "ended" ? "Zakończona" : "Kończy się"} {formatDate(s.endDate)}
            </p>
          )}
        </div>

        <div className="flex items-center">
          {status !== "ended" && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onToggleActive(s)}
              aria-label={
                s.isActive ? `Wstrzymaj subskrypcję: ${s.name}` : `Wznów subskrypcję: ${s.name}`
              }
            >
              {s.isActive ? <Pause /> : <Play />}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(s)}
            aria-label={`Edytuj subskrypcję: ${s.name}`}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(s)}
            aria-label={`Usuń subskrypcję: ${s.name}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}
