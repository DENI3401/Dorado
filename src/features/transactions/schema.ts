import { z } from "zod";
import type { Category } from "@/features/categories/types";
import { MAX_AMOUNT, parseAmount, roundMoney } from "./utils/money";
import { isValidIsoDate } from "./utils/isoDate";

/**
 * Pole kwoty jest w formularzu tekstem (obsługa "12,50"),
 * a po walidacji staje się dodatnim number zaokrąglonym do 2 miejsc.
 */
export const amountSchema = z
  .string("Podaj kwotę")
  .trim()
  .min(1, "Podaj kwotę")
  .transform((value, ctx) => {
    const parsed = parseAmount(value);
    if (parsed === null) {
      ctx.addIssue({ code: "custom", message: "Nieprawidłowa kwota" });
      return z.NEVER;
    }
    return roundMoney(parsed);
  })
  .pipe(
    z
      .number()
      .positive("Kwota musi być większa od zera")
      .max(MAX_AMOUNT, "Kwota jest zbyt duża"),
  );

export const isoDateSchema = z
  .string("Podaj datę")
  .refine(isValidIsoDate, "Nieprawidłowa data")
  .refine((v) => v >= "1970-01-01" && v <= "2100-12-31", "Data poza dozwolonym zakresem");

export const transactionFormBase = z.object({
  type: z.enum(["income", "expense"], "Wybierz typ operacji"),
  incomeKind: z.enum(["salary", "bonus"]).optional(),
  amount: amountSchema,
  categoryId: z.string().min(1, "Wybierz kategorię"),
  date: isoDateSchema,
  note: z.string().trim().max(200, "Notatka może mieć maksymalnie 200 znaków").default(""),
});

/** Typ wartości w polach formularza (amount: string). */
export type TransactionFormInput = z.input<typeof transactionFormBase>;
/** Typ po walidacji (amount: number). */
export type TransactionFormValues = z.output<typeof transactionFormBase>;

/**
 * Schemat z regułami zależnymi od danych: rodzaj przychodu wymagany tylko dla
 * przychodów, a kategoria musi istnieć i zgadzać się z typem operacji.
 */
export function makeTransactionFormSchema(categories: readonly Category[]) {
  return transactionFormBase.superRefine((values, ctx) => {
    if (values.type === "income" && !values.incomeKind) {
      ctx.addIssue({
        code: "custom",
        path: ["incomeKind"],
        message: "Wybierz rodzaj przychodu",
      });
    }
    const category = categories.find((c) => c.id === values.categoryId);
    if (!category) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Wybrana kategoria nie istnieje",
      });
    } else if (category.type !== values.type) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Kategoria nie pasuje do typu operacji",
      });
    }
  });
}
