import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryBadgeProps {
  icon: string;
  color: string;
  className?: string;
}

/** Okrągła ikona kategorii na przyciemnionym tle w jej kolorze. */
export function CategoryBadge({ icon, color, className }: CategoryBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full", className)}
      style={{ backgroundColor: `${color}26`, color }}
    >
      <CategoryIcon name={icon} className="size-4.5" />
    </span>
  );
}
