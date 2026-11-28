/**
 * Czysta logika danych demo (F15): budowanie stanu z pliku i usuwanie go.
 * Bez Reacta i bez magazynów — wszystko da się przetestować z dowolną datą „dziś”.
 */
import type { BackupData } from "@/features/backup/schema";
import { FALLBACK_CATEGORY_ID } from "@/features/categories/defaultCategories";
import type { Category } from "@/features/categories/types";
import type { RecurringIncome } from "@/features/recurring-income/types";
import type { Subscription } from "@/features/subscriptions/types";
import type { Transaction, TransactionType } from "@/features/transactions/types";
import { resolveRelativeDate } from "./dates";
import { DEMO_ID_PREFIX, type DemoFile } from "./schema";

/** Te części stanu, które wypełnia demo (ustawienia i flaga alertu zostają bez zmian). */
export interface DemoCollections {
  transactions: Transaction[];
  customCategories: Category[];
  subscriptions: Subscription[];
  recurringIncomes: RecurringIncome[];
}

export interface DemoCounts {
  transactions: number;
  subscriptions: number;
  recurringIncomes: number;
  customCategories: number;
}

export function isDemoId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith(DEMO_ID_PREFIX);
}

/**
 * Operacja należy do demo, gdy sama jest z pliku albo powstała automatycznie z subskrypcji
 * lub wynagrodzenia demo (te mają losowe id, ale wskazują na rekord demo).
 */
export function isDemoTransaction(t: Transaction): boolean {
  return isDemoId(t.id) || isDemoId(t.subscriptionId) || isDemoId(t.recurringIncomeId);
}

/** Stały, rosnący z kolejnością czas utworzenia — wynik jest powtarzalny (testy). */
function createdAtFor(date: string, order: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 8, 0, order)).toISOString();
}

/**
 * Buduje dane demo dla dnia `todayIso` (YYYY-MM-DD). Daty względne z pliku zamieniają się
 * na konkretne; wpływy wynagrodzeń i płatności subskrypcji do dziś dopisze potem sama
 * aplikacja (synchronizacja w AppLayout), tak jak dla danych użytkownika.
 */
export function buildDemoData(file: DemoFile, todayIso: string): DemoCollections {
  const date = (spec: Parameters<typeof resolveRelativeDate>[0]) => resolveRelativeDate(spec, todayIso);
  let order = 0;

  const customCategories: Category[] = file.categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    icon: c.icon,
    color: c.color,
    isDefault: false,
  }));

  const recurringIncomes: RecurringIncome[] = file.recurringIncomes.map((r) => {
    const startDate = date(r.start);
    return {
      id: r.id,
      amount: r.amount,
      categoryId: r.categoryId,
      period: "monthly",
      startDate,
      endDate: null,
      isActive: r.isActive,
      note: r.note,
      createdAt: createdAtFor(startDate, order++),
      generatedThrough: null,
    };
  });

  const subscriptions: Subscription[] = file.subscriptions.map((s) => {
    const startDate = date(s.start);
    return {
      id: s.id,
      name: s.name,
      amount: s.amount,
      categoryId: s.categoryId,
      period: s.period,
      startDate,
      endDate: s.end ? date(s.end) : null,
      isActive: s.isActive,
      note: s.note,
      createdAt: createdAtFor(startDate, order++),
    };
  });

  const incomes: Transaction[] = file.incomes.map((i) => {
    const day = date(i.date);
    return {
      id: i.id,
      type: "income",
      incomeKind: i.incomeKind,
      amount: i.amount,
      categoryId: i.categoryId,
      date: day,
      note: i.note,
      createdAt: createdAtFor(day, order++),
      ...(i.recurringIncomeId !== undefined && { recurringIncomeId: i.recurringIncomeId }),
    };
  });

  const expenses: Transaction[] = file.expenses.map((e) => {
    const day = date(e.date);
    return {
      id: e.id,
      type: "expense",
      incomeKind: null,
      amount: e.amount,
      categoryId: e.categoryId,
      date: day,
      note: e.note,
      createdAt: createdAtFor(day, order++),
      ...(e.subscriptionId !== undefined && { subscriptionId: e.subscriptionId }),
    };
  });

  // Jak w magazynie: najnowsze na początku.
  const transactions = [...incomes, ...expenses].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  return { transactions, customCategories, subscriptions, recurringIncomes };
}

/** Ile rekordów demo jest w stanie (do okna potwierdzenia i do decyzji, czy pokazać przycisk). */
export function countDemoData(state: DemoCollections): DemoCounts {
  return {
    transactions: state.transactions.filter(isDemoTransaction).length,
    subscriptions: state.subscriptions.filter((s) => isDemoId(s.id)).length,
    recurringIncomes: state.recurringIncomes.filter((r) => isDemoId(r.id)).length,
    customCategories: state.customCategories.filter((c) => isDemoId(c.id)).length,
  };
}

export function hasDemoData(counts: DemoCounts): boolean {
  return (
    counts.transactions + counts.subscriptions + counts.recurringIncomes + counts.customCategories >
    0
  );
}

export interface RemoveDemoResult {
  data: BackupData;
  removed: DemoCounts;
  /** Własne rekordy użytkownika przeniesione z kategorii demo do kategorii „Inne”. */
  reassigned: number;
}

/**
 * Stan bez danych demo. Własne rekordy użytkownika zostają; jeśli używały kategorii demo,
 * trafiają do kategorii zapasowej („Inne wydatki” / „Inne przychody”) — tak samo jak przy
 * usuwaniu kategorii. Usuwane są też znaczniki synchronizacji subskrypcji demo.
 */
export function removeDemoData(data: BackupData): RemoveDemoResult {
  const demoCategoryType = new Map<string, TransactionType>(
    data.customCategories.filter((c) => isDemoId(c.id)).map((c) => [c.id, c.type]),
  );
  let reassigned = 0;
  const keepCategory = (categoryId: string): string => {
    const type = demoCategoryType.get(categoryId);
    if (type === undefined) return categoryId;
    reassigned += 1;
    return FALLBACK_CATEGORY_ID[type];
  };

  const transactions = data.transactions
    .filter((t) => !isDemoTransaction(t))
    .map((t) => ({ ...t, categoryId: keepCategory(t.categoryId) }));
  const subscriptions = data.subscriptions
    .filter((s) => !isDemoId(s.id))
    .map((s) => ({ ...s, categoryId: keepCategory(s.categoryId) }));
  const recurringIncomes = data.recurringIncomes
    .filter((r) => !isDemoId(r.id))
    .map((r) => ({ ...r, categoryId: keepCategory(r.categoryId) }));
  const customCategories = data.customCategories.filter((c) => !isDemoId(c.id));
  const subscriptionSync = Object.fromEntries(
    Object.entries(data.subscriptionSync).filter(([id]) => !isDemoId(id)),
  );

  return {
    data: { ...data, transactions, subscriptions, recurringIncomes, customCategories, subscriptionSync },
    removed: countDemoData(data),
    reassigned,
  };
}
