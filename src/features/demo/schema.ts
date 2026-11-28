import { z } from "zod";

/** Wszystkie rekordy demo mają id z tym prefiksem — po nim „Wyczyść dane demo” je rozpoznaje. */
export const DEMO_ID_PREFIX = "demo-";

const demoIdSchema = z
  .string()
  .startsWith(DEMO_ID_PREFIX, `Id danych demo musi zaczynać się od „${DEMO_ID_PREFIX}”`);

/** Opcjonalny opis dla ludzi: którą funkcję lub przypadek brzegowy pokazuje rekord. Kod go pomija. */
const purposeSchema = z.string().optional();

const daysAgoSchema = z.strictObject({
  daysAgo: z.number().int().min(0, "Operacja demo nie może być w przyszłości").max(400),
});

const monthDaySchema = z.strictObject({
  /** Ujemne = miesiąc w przyszłości (np. data zakończenia subskrypcji). */
  monthsAgo: z.number().int().min(-24).max(24),
  day: z.number().int().min(1).max(31),
});

/**
 * Data operacji: „N dni temu” albo „dzień D miesiąca sprzed N miesięcy” — tylko z przeszłych
 * miesięcy (monthsAgo ≥ 1), żeby żadna operacja nie trafiła w przyszłość.
 */
const pastDateSchema = z.union([
  daysAgoSchema,
  monthDaySchema.refine((d) => d.monthsAgo >= 1, "Operacja demo nie może być w przyszłości"),
]);

/**
 * Struktura pliku src/data/mock.json. Sprawdza tylko kształt i daty względne — szczegółowe reguły
 * pól (kwoty, kolory, długości nazw, spójność kategorii) sprawdza po zbudowaniu danych schemat
 * kopii zapasowej z F14 (`backupDataSchema`), więc reguły nie są powielane.
 */
export const demoFileSchema = z.strictObject({
  version: z.literal(1),
  description: z.string().optional(),
  categories: z.array(
    z.strictObject({
      id: demoIdSchema,
      name: z.string(),
      type: z.enum(["income", "expense"]),
      icon: z.string(),
      color: z.string(),
      purpose: purposeSchema,
    }),
  ),
  recurringIncomes: z.array(
    z.strictObject({
      id: demoIdSchema,
      amount: z.number(),
      categoryId: z.string(),
      start: monthDaySchema,
      isActive: z.boolean(),
      note: z.string(),
      purpose: purposeSchema,
    }),
  ),
  subscriptions: z.array(
    z.strictObject({
      id: demoIdSchema,
      name: z.string(),
      amount: z.number(),
      categoryId: z.string(),
      period: z.enum(["monthly", "yearly"]),
      start: monthDaySchema,
      end: monthDaySchema.nullable(),
      isActive: z.boolean(),
      note: z.string(),
      purpose: purposeSchema,
    }),
  ),
  incomes: z.array(
    z.strictObject({
      id: demoIdSchema,
      incomeKind: z.enum(["salary", "bonus"]),
      amount: z.number(),
      categoryId: z.string(),
      date: pastDateSchema,
      note: z.string(),
      /** Wpływ z wynagrodzenia cyklicznego (np. historia sprzed wstrzymania). */
      recurringIncomeId: demoIdSchema.optional(),
      purpose: purposeSchema,
    }),
  ),
  expenses: z.array(
    z.strictObject({
      id: demoIdSchema,
      amount: z.number(),
      categoryId: z.string(),
      date: pastDateSchema,
      note: z.string(),
      /** Płatność subskrypcji (np. historia subskrypcji, która jest teraz wstrzymana). */
      subscriptionId: demoIdSchema.optional(),
      purpose: purposeSchema,
    }),
  ),
});

export type DemoFile = z.output<typeof demoFileSchema>;
