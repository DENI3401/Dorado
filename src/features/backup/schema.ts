import { z } from "zod";
import {
  DEFAULT_CATEGORIES,
  categoryFormBase,
  normalizeName,
  type Category,
} from "@/features/categories";
import { cycleStartDaySchema, lowBalanceThresholdSchema } from "@/features/settings/schema";
import { subscriptionFormBase } from "@/features/subscriptions/schema";
import { isoDateSchema, transactionFormBase } from "@/features/transactions/schema";
import { MAX_AMOUNT, roundMoney } from "@/features/transactions/utils/money";

/** Znacznik aplikacji w pliku — odróżnia kopię Dorado od dowolnego innego JSON-a. */
export const BACKUP_APP = "dorado";
/** Wersja formatu pliku. Zmiana struktury danych = nowa wersja (+ migracja przy imporcie). */
export const BACKUP_VERSION = 1;

/**
 * Kwota zapisana w magazynie: liczba > 0, maks. 2 miejsca po przecinku.
 * (amountSchema z formularza przyjmuje tekst „12,50” — tu dostajemy już liczbę z JSON-a.)
 */
const storedAmountSchema = z
  .number("Kwota musi być liczbą")
  .positive("Kwota musi być większa od zera")
  .max(MAX_AMOUNT, "Kwota jest zbyt duża")
  .refine((v) => roundMoney(v) === v, "Kwota może mieć maksymalnie 2 miejsca po przecinku");

const idSchema = z.string("Brak identyfikatora").min(1, "Pusty identyfikator");
const createdAtSchema = z.iso.datetime({ message: "Nieprawidłowa data utworzenia" });
const optionalDateSchema = isoDateSchema.nullable();

// Pola wspólne z formularzami bierzemy z istniejących schematów, żeby reguły się nie rozjechały.
const tx = transactionFormBase.shape;
const sub = subscriptionFormBase.shape;
const cat = categoryFormBase.shape;

export const backupTransactionSchema = z.object({
  id: idSchema,
  type: tx.type,
  incomeKind: z.enum(["salary", "bonus"], "Nieprawidłowy rodzaj przychodu").nullable(),
  amount: storedAmountSchema,
  categoryId: tx.categoryId,
  date: tx.date,
  note: z.string().max(200, "Notatka może mieć maksymalnie 200 znaków"),
  createdAt: createdAtSchema,
  subscriptionId: idSchema.optional(),
  recurringIncomeId: idSchema.optional(),
});

export const backupCategorySchema = z.object({
  id: idSchema,
  name: cat.name,
  type: cat.type,
  // Tekst (jak w typie Category), ale tylko z listy ikon kreatora kategorii.
  icon: z.string("Wybierz ikonę").refine((v) => cat.icon.safeParse(v).success, "Nieznana ikona"),
  color: cat.color,
  isDefault: z
    .boolean()
    .refine((v) => v === false, "Kopia może zawierać tylko kategorie własne"),
});

export const backupSubscriptionSchema = z.object({
  id: idSchema,
  name: sub.name,
  amount: storedAmountSchema,
  categoryId: sub.categoryId,
  period: sub.period,
  startDate: sub.startDate,
  endDate: optionalDateSchema,
  isActive: z.boolean(),
  note: z.string().max(200, "Notatka może mieć maksymalnie 200 znaków"),
  createdAt: createdAtSchema,
});

export const backupRecurringIncomeSchema = z.object({
  id: idSchema,
  amount: storedAmountSchema,
  categoryId: tx.categoryId,
  period: z.literal("monthly", "Wynagrodzenie stałe musi być miesięczne"),
  startDate: isoDateSchema,
  endDate: optionalDateSchema,
  isActive: z.boolean(),
  note: z.string().max(200, "Notatka może mieć maksymalnie 200 znaków"),
  createdAt: createdAtSchema,
  generatedThrough: optionalDateSchema,
});

/**
 * Schematy ustawień przyjmują też tekst z formularza („750,50”). W pliku wymagamy liczby,
 * a dalej sprawdzamy ją tymi samymi regułami (te same komunikaty błędów).
 */
function jsonNumber(rules: z.ZodType<number, string | number>, typeMessage: string) {
  return z.number(typeMessage).transform((value, ctx) => {
    const result = rules.safeParse(value);
    if (result.success) return result.data;
    for (const issue of result.error.issues) {
      ctx.addIssue({ code: "custom", message: issue.message });
    }
    return z.NEVER;
  });
}

export const backupSettingsSchema = z.object({
  cycleStartDay: jsonNumber(cycleStartDaySchema, "Dzień cyklu musi być liczbą"),
  lowBalanceThreshold: jsonNumber(lowBalanceThresholdSchema, "Próg alertu musi być liczbą"),
});

export const backupAlertsSchema = z.object({
  lowBalanceAlertTriggered: z.boolean(),
  alertCycleStart: optionalDateSchema,
});

const backupDataBase = z.object({
  transactions: z.array(backupTransactionSchema, "Brak listy transakcji"),
  customCategories: z.array(backupCategorySchema, "Brak listy kategorii"),
  subscriptions: z.array(backupSubscriptionSchema, "Brak listy subskrypcji"),
  recurringIncomes: z.array(backupRecurringIncomeSchema, "Brak listy wynagrodzeń stałych"),
  settings: backupSettingsSchema,
  alerts: backupAlertsSchema,
  /** Do kiedy płatności subskrypcji zostały zaksięgowane (id subskrypcji → YYYY-MM-DD). */
  subscriptionSync: z.record(z.string(), isoDateSchema),
});

type BackupDataBase = z.output<typeof backupDataBase>;
type Ctx = z.core.$RefinementCtx<BackupDataBase>;

function reportDuplicateIds(items: readonly { id: string }[], key: keyof BackupDataBase, ctx: Ctx) {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      ctx.addIssue({ code: "custom", path: [key, index, "id"], message: "Powtórzony identyfikator" });
    }
    seen.add(item.id);
  });
}

/**
 * Reguły spójności między kolekcjami — te same, których pilnuje aplikacja przy zwykłej pracy:
 * unikalne id, kategorie istnieją i pasują typem, nazwy kategorii się nie powtarzają itd.
 */
function checkConsistency(data: BackupDataBase, ctx: Ctx) {
  reportDuplicateIds(data.transactions, "transactions", ctx);
  reportDuplicateIds(data.customCategories, "customCategories", ctx);
  reportDuplicateIds(data.subscriptions, "subscriptions", ctx);
  reportDuplicateIds(data.recurringIncomes, "recurringIncomes", ctx);

  const defaultIds = new Set(DEFAULT_CATEGORIES.map((c) => c.id));
  const names = new Set(DEFAULT_CATEGORIES.map((c) => `${c.type}:${normalizeName(c.name)}`));
  data.customCategories.forEach((c, index) => {
    if (defaultIds.has(c.id)) {
      ctx.addIssue({
        code: "custom",
        path: ["customCategories", index, "id"],
        message: "Identyfikator zajęty przez kategorię domyślną",
      });
    }
    const key = `${c.type}:${normalizeName(c.name)}`;
    if (names.has(key)) {
      ctx.addIssue({
        code: "custom",
        path: ["customCategories", index, "name"],
        message: "Kategoria o takiej nazwie już istnieje",
      });
    }
    names.add(key);
  });

  const categories = new Map<string, Category>(
    [...DEFAULT_CATEGORIES, ...data.customCategories].map((c) => [c.id, c]),
  );
  const checkCategory = (
    key: keyof BackupDataBase,
    index: number,
    categoryId: string,
    type: Category["type"],
  ) => {
    const category = categories.get(categoryId);
    if (!category) {
      ctx.addIssue({
        code: "custom",
        path: [key, index, "categoryId"],
        message: "Kategoria nie istnieje",
      });
    } else if (category.type !== type) {
      ctx.addIssue({
        code: "custom",
        path: [key, index, "categoryId"],
        message: "Kategoria nie pasuje do typu operacji",
      });
    }
  };

  data.transactions.forEach((t, index) => {
    checkCategory("transactions", index, t.categoryId, t.type);
    if (t.type === "income" && t.incomeKind === null) {
      ctx.addIssue({
        code: "custom",
        path: ["transactions", index, "incomeKind"],
        message: "Przychód musi mieć rodzaj (wynagrodzenie lub premia)",
      });
    }
    if (t.type === "expense" && t.incomeKind !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["transactions", index, "incomeKind"],
        message: "Wydatek nie może mieć rodzaju przychodu",
      });
    }
  });

  data.subscriptions.forEach((s, index) => {
    checkCategory("subscriptions", index, s.categoryId, "expense");
    if (s.endDate !== null && s.endDate < s.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["subscriptions", index, "endDate"],
        message: "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia",
      });
    }
  });

  data.recurringIncomes.forEach((r, index) => {
    checkCategory("recurringIncomes", index, r.categoryId, "income");
    if (r.endDate !== null && r.endDate < r.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["recurringIncomes", index, "endDate"],
        message: "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia",
      });
    }
  });
}

export const backupDataSchema = backupDataBase.superRefine(checkConsistency);

/** Cały plik kopii zapasowej (F14). */
export const backupFileSchema = z.object({
  app: z.literal(BACKUP_APP, "To nie jest kopia zapasowa Dorado"),
  version: z.literal(BACKUP_VERSION, "Nieobsługiwana wersja kopii zapasowej"),
  exportedAt: z.iso.datetime({ message: "Nieprawidłowa data eksportu" }),
  data: backupDataSchema,
});

export type BackupData = z.output<typeof backupDataSchema>;
export type BackupFile = z.output<typeof backupFileSchema>;
