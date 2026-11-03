export type TransactionType = "income" | "expense";

/** Rodzaj przychodu: stała pensja albo premia / dochód nieregularny. */
export type IncomeKind = "salary" | "bonus";

export interface Transaction {
  id: string;
  type: TransactionType;
  /** Tylko dla przychodów; dla wydatków zawsze null. */
  incomeKind: IncomeKind | null;
  /** Zawsze > 0, zaokrąglona do 2 miejsc. Znak wynika z `type`. */
  amount: number;
  categoryId: string;
  /** YYYY-MM-DD */
  date: string;
  note: string;
  /** ISO timestamp utworzenia (do stabilnego sortowania). */
  createdAt: string;
  /** Wypełniane przez moduł subskrypcji dla wydatków generowanych automatycznie. */
  subscriptionId?: string;
}
