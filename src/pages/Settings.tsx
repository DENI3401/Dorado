import { BudgetSettingsForm } from "@/components/settings/BudgetSettingsForm";
import { SETTINGS_TITLES } from "@/features/settings";

export default function Settings() {
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <h2 className="text-2xl font-semibold">{SETTINGS_TITLES.page}</h2>

      <BudgetSettingsForm />

      {/* F14: pod formularzem budżetu dojdzie <SettingsSection title="Kopia zapasowa"> z eksportem i importem JSON. */}
    </div>
  );
}
