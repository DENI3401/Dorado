import { z } from "zod";
import type { Category } from "@/features/categories/types";
import { amountSchema, isoDateSchema } from "@/features/transactions/schema";

export const subscriptionFormBase = z.object({
  name: z
    .string("Podaj nazwę")
    .trim()
    .min(1, "Podaj nazwę")
    .max(40, "Nazwa może mieć maksymalnie 40 znaków"),
  amount: amountSchema,
  categoryId: z.string().min(1, "Wybierz kategorię"),
  period: z.enum(["monthly", "yearly"], "Wybierz okres płatności"),
  startDate: isoDateSchema,
  /** Pusty napis = subskrypcja bezterminowa. */
  endDate: z
    .string()
    .trim()
    .refine((v) => v === "" || isoDateSchema.safeParse(v).success, "Nieprawidłowa data")
    .default(""),
  note: z.string().trim().max(200, "Notatka może mieć maksymalnie 200 znaków").default(""),
});

/** Typ wartości w polach formularza (amount: string). */
export type SubscriptionFormInput = z.input<typeof subscriptionFormBase>;
/** Typ po walidacji (amount: number, endDate: "" albo YYYY-MM-DD). */
export type SubscriptionFormValues = z.output<typeof subscriptionFormBase>;

/**
 * Schemat z regułami zależnymi od danych: kategoria musi istnieć i być kategorią
 * wydatków, a data zakończenia nie może być wcześniejsza niż data rozpoczęcia.
 */
export function makeSubscriptionFormSchema(categories: readonly Category[]) {
  return subscriptionFormBase.superRefine((values, ctx) => {
    const category = categories.find((c) => c.id === values.categoryId);
    if (!category) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Wybrana kategoria nie istnieje",
      });
    } else if (category.type !== "expense") {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Subskrypcja wymaga kategorii wydatków",
      });
    }
    if (values.endDate !== "" && values.endDate < values.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia",
      });
    }
  });
}
