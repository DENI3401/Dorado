import { useId, type ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Jeden blok strony ustawień: tytuł, krótki opis i treść.
 * Kolejne sekcje (np. „Kopia zapasowa” z F14) dodaje się jako następny <SettingsSection>.
 */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <header className="grid gap-1">
        <h3 id={headingId} className="text-base font-semibold">
          {title}
        </h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </header>
      {children}
    </section>
  );
}
