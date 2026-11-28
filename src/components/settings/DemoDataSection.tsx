import { ClearDemoDataButton } from "@/components/demo/ClearDemoDataButton";
import { DEMO_DESCRIPTIONS, DEMO_TITLES, demoContentsText, useDemoData } from "@/features/demo";
import { SettingsSection } from "./SettingsSection";

/** Sekcja „Dane demonstracyjne” w ustawieniach (F15). Widoczna tylko, gdy są jeszcze dane demo. */
export function DemoDataSection() {
  const { hasDemoData, counts } = useDemoData();
  if (!hasDemoData) return null;

  return (
    <SettingsSection title={DEMO_TITLES.section} description={DEMO_DESCRIPTIONS.section}>
      <p className="text-sm">
        Przykładowe dane w aplikacji: <span className="tabular-nums">{demoContentsText(counts)}</span>.
      </p>
      <div>
        <ClearDemoDataButton />
      </div>
    </SettingsSection>
  );
}
