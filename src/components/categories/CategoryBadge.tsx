import { cn } from "@/lib/utils";
import { getCategoryIcon } from "./categoryIcons";

interface CategoryBadgeProps {
  icon: string;
  color: string;
  className?: string;
}

/** Okrągła ikona kategorii na przyciemnionym tle w jej kolorze. */
export function CategoryBadge({ icon, color, className }: CategoryBadgeProps) {
  const Icon = getCategoryIcon(icon);
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full", className)}
      style={{ backgroundColor: `${color}26`, color }}
    >
      <Icon className="size-4.5" />
    </span>
  );
}
