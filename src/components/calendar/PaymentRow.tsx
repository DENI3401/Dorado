import { Check, Clock } from "lucide-react";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import type { Category } from "@/features/categories";
import { formatSubscriptionCost, type PaymentOccurrence } from "@/features/subscriptions";
import { formatPLN } from "@/features/transactions";
import { cn } from "@/lib/utils";

export function PaymentStatus({ paid, className }: { paid: boolean; className?: string }) {
  return paid ? (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400",
        className,
      )}
    >
      <Check className="size-3.5" aria-hidden="true" /> Zapłacono
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <Clock className="size-3.5" aria-hidden="true" /> Oczekuje
    </span>
  );
}

interface PaymentRowProps {
  occurrence: PaymentOccurrence;
  category?: Category;
}

/** Jedna płatność na liście dnia i w widoku mobilnym. */
export function PaymentRow({ occurrence, category }: PaymentRowProps) {
  const { subscription: s } = occurrence;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <CategoryBadge
        icon={category?.icon ?? "Ellipsis"}
        color={category?.color ?? "#64748b"}
        className="size-8"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{s.name}</p>
        <p className="truncate text-xs text-muted-foreground">{formatSubscriptionCost(s)}</p>
      </div>
      <div className="grid justify-items-end gap-0.5">
        <p className="text-sm font-semibold tabular-nums">{formatPLN(occurrence.amount)}</p>
        <PaymentStatus paid={occurrence.paid} />
      </div>
    </li>
  );
}
