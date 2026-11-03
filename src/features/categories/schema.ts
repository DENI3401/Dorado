import { z } from "zod";
import type { Category } from "./types";
import { CATEGORY_ICONS } from "./defaultCategories";

export const normalizeName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase("pl-PL");

export const categoryFormBase = z.object({
  name: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(2, "Nazwa musi mieć co najmniej 2 znaki")
        .max(30, "Nazwa może mieć maksymalnie 30 znaków"),
    ),
  type: z.enum(["income", "expense"], "Wybierz typ kategorii"),
  icon: z.enum(CATEGORY_ICONS, "Wybierz ikonę"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Wybierz poprawny kolor"),
});

export type CategoryFormInput = z.input<typeof categoryFormBase>;
export type CategoryFormValues = z.output<typeof categoryFormBase>;

/**
 * Schemat z kontrolą unikalności nazwy (bez rozróżniania wielkości liter,
 * w obrębie tego samego typu; uwzględnia też kategorie domyślne).
 * Przy edycji (`editing`) kategoria nie koliduje sama ze sobą, a jej typ jest
 * zablokowany — zmiana typu zepsułaby operacje, które już jej używają.
 */
export function makeCategoryFormSchema(
  existing: readonly Category[],
  editing?: Category,
) {
  return categoryFormBase.superRefine((values, ctx) => {
    const key = normalizeName(values.name);
    const clash = existing.some(
      (c) => c.id !== editing?.id && c.type === values.type && normalizeName(c.name) === key,
    );
    if (editing && values.type !== editing.type) {
      ctx.addIssue({
        code: "custom",
        path: ["type"],
        message: "Nie można zmienić typu istniejącej kategorii",
      });
    }
    if (clash) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: "Kategoria o takiej nazwie już istnieje",
      });
    }
  });
}
