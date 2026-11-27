import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  cycleStartDaySchema,
  lowBalanceThresholdSchema,
  settingsFormSchema,
  type SettingsFormInput,
  type SettingsFormValues,
} from "../schema";
import { useSettingsStore } from "../store";
import type { BudgetSettings } from "../types";

/** Zdarzenie po zapisie: UI pokazuje po nim Toast z „Cofnij” i woła alert niskiego salda. */
export interface SettingsSavedEvent {
  previous: BudgetSettings;
  next: BudgetSettings;
  cycleChanged: boolean;
  thresholdChanged: boolean;
}

/** Zmiana czekająca na potwierdzenie (przy zmianie dnia cyklu). */
export interface PendingSettingsChange {
  values: SettingsFormValues;
  cycleChanged: boolean;
  thresholdChanged: boolean;
}

interface Options {
  /** Wywoływane po zapisie (także po potwierdzeniu zmiany dnia cyklu). */
  onSaved?: (event: SettingsSavedEvent) => void;
}

/** Ustawienia ze store → wartości pól formularza (kwota z przecinkiem, jak w polskim UI). */
export function toFormInput(settings: BudgetSettings): SettingsFormInput {
  return {
    cycleStartDay: String(settings.cycleStartDay),
    lowBalanceThreshold: String(settings.lowBalanceThreshold).replace(".", ","),
  };
}

/** Bezgłowa logika formularza ustawień (bez żadnego JSX). */
export function useSettingsForm({ onSaved }: Options = {}) {
  const cycleStartDay = useSettingsStore((s) => s.cycleStartDay);
  const lowBalanceThreshold = useSettingsStore((s) => s.lowBalanceThreshold);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const form = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: toFormInput({ cycleStartDay, lowBalanceThreshold }),
  });

  // Ustawienia mogą się zmienić poza formularzem (import kopii zapasowej F14, Undo) — wtedy pola
  // pokazują nowe wartości. Po zwykłym zapisie wartości są już te same, więc reset nic nie psuje.
  useEffect(() => {
    form.reset(toFormInput({ cycleStartDay, lowBalanceThreshold }));
  }, [form, cycleStartDay, lowBalanceThreshold]);

  // Zmiana dnia cyklu wymaga potwierdzenia. `pending` zostaje po zamknięciu okna (treść nie miga
  // w trakcie animacji), a o tym, czy okno jest otwarte, decyduje `confirmOpen`.
  const [pending, setPending] = useState<PendingSettingsChange | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const watched = useWatch({ control: form.control });
  /**
   * Wartości z formularza zrozumiane „na żywo” (null, gdy pole jest jeszcze niepoprawne) —
   * do podglądu cyklu i salda przed zapisaniem.
   */
  const draft = {
    cycleStartDay: toNumber(cycleStartDaySchema.safeParse(watched.cycleStartDay ?? "")),
    lowBalanceThreshold: toNumber(
      lowBalanceThresholdSchema.safeParse(watched.lowBalanceThreshold ?? ""),
    ),
  };

  const save = useCallback(
    (values: SettingsFormValues) => {
      const previous = updateSettings(values);
      const next: BudgetSettings = {
        cycleStartDay: values.cycleStartDay,
        lowBalanceThreshold: values.lowBalanceThreshold,
      };
      // Po zapisie formularz znów jest „czysty” (przycisk Zapisz robi się nieaktywny).
      form.reset(toFormInput(next));
      onSaved?.({
        previous,
        next,
        cycleChanged: previous.cycleStartDay !== next.cycleStartDay,
        thresholdChanged: previous.lowBalanceThreshold !== next.lowBalanceThreshold,
      });
    },
    [form, onSaved, updateSettings],
  );

  const submit = form.handleSubmit((values) => {
    const cycleChanged = values.cycleStartDay !== cycleStartDay;
    const thresholdChanged = values.lowBalanceThreshold !== lowBalanceThreshold;
    if (cycleChanged) {
      setPending({ values, cycleChanged, thresholdChanged });
      setConfirmOpen(true);
      return;
    }
    save(values);
  });

  /** Użytkownik potwierdził zmianę dnia cyklu. */
  const confirm = () => {
    setConfirmOpen(false);
    if (pending) save(pending.values);
  };

  /** Użytkownik zrezygnował z zmiany dnia cyklu — formularz zostaje z jego wpisem. */
  const cancel = () => setConfirmOpen(false);

  /** Cofnięcie zapisu (Undo z toastu): przywraca wartości zwrócone przez updateSettings. */
  const undo = useCallback(
    (event: SettingsSavedEvent) => {
      updateSettings(event.previous);
      form.reset(toFormInput(event.previous));
    },
    [form, updateSettings],
  );

  return {
    form,
    submit,
    /** Ustawienia aktualnie zapisane w store. */
    saved: { cycleStartDay, lowBalanceThreshold } satisfies BudgetSettings,
    /** Wartości z formularza na żywo (null = pole niepoprawne). */
    draft,
    /** Zmiana dnia cyklu czeka na potwierdzenie (AlertDialog). */
    pending,
    confirmOpen,
    confirm,
    cancel,
    undo,
    /** Odrzuca niezapisane zmiany i wraca do wartości ze store. */
    discard: () => form.reset(toFormInput({ cycleStartDay, lowBalanceThreshold })),
  };
}

function toNumber(result: { success: true; data: number } | { success: false }): number | null {
  return result.success ? result.data : null;
}
