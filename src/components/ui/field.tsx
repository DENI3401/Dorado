import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Wspólny styl pól tekstowych, dat i selectów (zgodny z tokenami shadcn). */
export const inputClass =
  "h-9 pointer-coarse:h-11 w-full rounded-lg border border-input bg-background px-3 text-sm pointer-coarse:text-base outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

interface FieldProps {
  label: string;
  /** id kontrolki (input/select/textarea) — łączy label z polem. */
  htmlFor?: string;
  /** id etykiety, gdy pole to grupa przycisków (radiogroup) i label nie ma kontrolki. */
  labelId?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, labelId, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
      ) : (
        <span id={labelId} className="text-sm font-medium">
          {label}
        </span>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
