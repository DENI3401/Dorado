import { z } from "zod";
import { MAX_AMOUNT, parseAmount, roundMoney } from "@/features/transactions/utils/money";

/**
 * Pola formularza ustawień to tekst (select / input z przecinkiem: "750,50"),
 * po walidacji stają się liczbami. Schemat przyjmuje też gotowe liczby — przydatne w testach.
 */
function numericInput(requiredMessage: string, invalidMessage: string) {
  return z.union([z.string(), z.number()], requiredMessage).transform((value, ctx) => {
    const parsed =
      typeof value === "number" ? value : value.trim() === "" ? null : parseAmount(value);
    if (parsed === null || !Number.isFinite(parsed)) {
      ctx.addIssue({
        code: "custom",
        message: typeof value === "string" && value.trim() === "" ? requiredMessage : invalidMessage,
      });
      return z.NEVER;
    }
    return parsed;
  });
}

/** Dzień początku cyklu: liczba całkowita 1–31. */
export const cycleStartDaySchema = numericInput(
  "Podaj dzień początku cyklu",
  "Dzień cyklu musi być liczbą",
).pipe(
  z
    .number()
    .int("Dzień cyklu musi być liczbą całkowitą")
    .min(1, "Dzień cyklu musi być między 1 a 31")
    .max(31, "Dzień cyklu musi być między 1 a 31"),
);

/** Próg alertu niskiego salda w PLN: ≥ 0 (0 = alert wyłączony), zaokrąglony do 2 miejsc. */
export const lowBalanceThresholdSchema = numericInput(
  "Podaj próg alertu (0 wyłącza alert)",
  "Nieprawidłowa kwota",
).pipe(
  z
    .number()
    .min(0, "Próg nie może być ujemny")
    .max(MAX_AMOUNT, "Próg jest zbyt duży")
    .transform(roundMoney),
);

export const settingsFormSchema = z.object({
  cycleStartDay: cycleStartDaySchema,
  lowBalanceThreshold: lowBalanceThresholdSchema,
});

/** Wartości w polach formularza (tekst). */
export type SettingsFormInput = z.input<typeof settingsFormSchema>;
/** Wartości po walidacji (liczby). */
export type SettingsFormValues = z.output<typeof settingsFormSchema>;
