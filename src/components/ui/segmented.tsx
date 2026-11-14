import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Dodatkowe klasy dla zaznaczonej opcji (np. kolor przychodu / wydatku). */
  activeClassName?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  label: string;
  disabled?: boolean;
  className?: string;
}

/** Przełącznik 2–3 opcji (radiogroup) — zamiennik Switch/Tabs w formularzach i filtrach. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  disabled,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex w-full rounded-lg bg-muted p-0.5", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 pointer-coarse:h-10 flex-1 rounded-md px-3 text-sm font-medium text-muted-foreground transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              active && "bg-background text-foreground shadow-sm dark:bg-card",
              active && option.activeClassName,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
