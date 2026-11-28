import { useId } from "react";
import { Sparkles } from "lucide-react";
import { DEMO_DESCRIPTIONS, DEMO_TITLES, useDemoData } from "@/features/demo";
import { ClearDemoDataButton } from "./ClearDemoDataButton";

/**
 * Informacja na Dashboardzie, że aplikacja pokazuje dane przykładowe (F15).
 * Znika sama, gdy w magazynach nie ma już żadnego rekordu demo.
 */
export function DemoDataBanner() {
  const { hasDemoData } = useDemoData();
  const headingId = useId();
  if (!hasDemoData) return null;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 px-4 py-3"
    >
      <Sparkles className="size-5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
      <div className="grid min-w-0 flex-1 basis-56 gap-0.5">
        <h3 id={headingId} className="text-sm font-medium">
          {DEMO_TITLES.banner}
        </h3>
        <p className="text-sm text-muted-foreground">{DEMO_DESCRIPTIONS.banner}</p>
      </div>
      <ClearDemoDataButton size="default" />
    </section>
  );
}
