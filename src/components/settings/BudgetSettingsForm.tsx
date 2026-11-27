import { useId, useMemo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { checkLowBalance, isBelowThreshold } from "@/features/alerts";
import {
  getCycleBalance,
  getCycleRange,
  getOpeningBalance,
} from "@/features/budget-cycle";
import { useToday } from "@/features/dashboard";
import {
  SETTINGS_DESCRIPTIONS,
  SETTINGS_HINTS,
  SETTINGS_TITLES,
  currentCycleMessage,
  restoredSettingsMessage,
  savedSettingsMessage,
  thresholdStatusMessage,
  useSettingsForm,
} from "@/features/settings";
import { formatPLN, useTransactionsStore } from "@/features/transactions";
import { cn } from "@/lib/utils";
import { ConfirmCycleChangeDialog } from "./ConfirmCycleChangeDialog";
import { SettingsSection } from "./SettingsSection";

const CYCLE_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** Pole z podglądem „na żywo” — czytnik ekranu ogłasza zmiany bez przenoszenia fokusu. */
function LivePreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div aria-live="polite" className={cn("grid gap-1 rounded-lg bg-muted/50 px-3 py-2.5 text-sm", className)}>
      {children}
    </div>
  );
}

/** Formularz ustawień budżetu: dzień cyklu i próg alertu niskiego salda. */
export function BudgetSettingsForm() {
  const id = useId();
  const today = useToday();
  const transactions = useTransactionsStore((s) => s.transactions);

  const settingsForm = useSettingsForm({
    onSaved: (event) => {
      toast.success(savedSettingsMessage, {
        duration: 8000,
        action: {
          label: "Cofnij",
          onClick: () => {
            settingsForm.undo(event);
            toast(restoredSettingsMessage);
          },
        },
      });
      // Od razu po zapisie (README 3.4): zmiana progu pomija „Trigger Once”. Gdy zmienił się tylko
      // dzień cyklu, force nie jest potrzebny — nowy początek cyklu sam daje nową ocenę.
      checkLowBalance({ force: event.thresholdChanged });
    },
  });
  const { form, submit, saved, draft, pending, confirmOpen, confirm, cancel, discard } = settingsForm;
  const {
    register,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  // Podgląd liczymy z wartości formularza, a nie ze store — użytkownik widzi skutek przed zapisem.
  const previewDay = draft.cycleStartDay ?? saved.cycleStartDay;
  const cycle = useMemo(() => getCycleRange(today, previewDay), [today, previewDay]);
  const opening = useMemo(() => getOpeningBalance(transactions, cycle.start), [transactions, cycle]);
  const cycleBalance = useMemo(() => getCycleBalance(transactions, cycle), [transactions, cycle]);

  const threshold = draft.lowBalanceThreshold;
  const isBelow = threshold !== null && isBelowThreshold(cycleBalance.balance, threshold);
  const newRange = pending ? getCycleRange(today, pending.values.cycleStartDay) : null;

  return (
    <>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <SettingsSection title={SETTINGS_TITLES.cycle} description={SETTINGS_DESCRIPTIONS.cycle}>
          <Field
            label="Dzień początku cyklu"
            htmlFor={`${id}-day`}
            hint={SETTINGS_HINTS.cycleStartDay}
            error={errors.cycleStartDay?.message}
            className="max-w-xs"
          >
            <select
              id={`${id}-day`}
              aria-invalid={errors.cycleStartDay ? true : undefined}
              className={inputClass}
              {...register("cycleStartDay")}
            >
              {CYCLE_DAYS.map((day) => (
                <option key={day} value={String(day)}>
                  {day}
                </option>
              ))}
            </select>
          </Field>
          <LivePreview>
            <p className="tabular-nums">{currentCycleMessage(cycle, opening)}</p>
          </LivePreview>
        </SettingsSection>

        <SettingsSection
          title={SETTINGS_TITLES.lowBalance}
          description={SETTINGS_DESCRIPTIONS.lowBalance}
        >
          <Field
            label="Próg alertu"
            htmlFor={`${id}-threshold`}
            hint={SETTINGS_HINTS.lowBalanceThreshold}
            error={errors.lowBalanceThreshold?.message}
            className="max-w-xs"
          >
            <div className="relative">
              <input
                id={`${id}-threshold`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                aria-invalid={errors.lowBalanceThreshold ? true : undefined}
                className={cn(inputClass, "pr-9 text-right tabular-nums")}
                {...register("lowBalanceThreshold")}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground"
              >
                zł
              </span>
            </div>
          </Field>
          <LivePreview>
            <p>
              Saldo cyklu:{" "}
              <strong className="font-semibold tabular-nums">{formatPLN(cycleBalance.balance)}</strong>
            </p>
            {threshold !== null && (
              <p
                className={cn(
                  "flex items-start gap-1.5",
                  isBelow ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
                )}
              >
                {isBelow && <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                {thresholdStatusMessage({ threshold, isBelow })}
              </p>
            )}
          </LivePreview>
        </SettingsSection>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {isDirty && (
            <Button type="button" variant="ghost" size="lg" onClick={discard}>
              Odrzuć zmiany
            </Button>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={!isDirty || isSubmitting}
            className="bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Zapisz
          </Button>
        </div>
      </form>

      <ConfirmCycleChangeDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) cancel();
        }}
        newRange={newRange}
        onConfirm={confirm}
      />
    </>
  );
}
