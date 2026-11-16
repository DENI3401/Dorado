import { Receipt, SearchX, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="grid gap-1">
        <h3 className="font-medium">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

/** Brak jakichkolwiek operacji — zaproszenie do dodania pierwszej. */
export function NoTransactionsState({ children }: { children: ReactNode }) {
  return (
    <EmptyState
      icon={Receipt}
      title="Nie masz jeszcze żadnych operacji"
      description="Dodaj pierwszy przychód lub wydatek, a pojawi się tutaj razem z podsumowaniem."
    >
      {children}
    </EmptyState>
  );
}

/** Filtry nie pasują do żadnej operacji. */
export function NoResultsState({ children }: { children: ReactNode }) {
  return (
    <EmptyState
      icon={SearchX}
      title="Nic nie znaleziono"
      description="Żadna operacja nie spełnia wybranych filtrów. Zmień kryteria albo wyczyść filtry."
    >
      {children}
    </EmptyState>
  );
}
