/**
 * Wynagrodzenie stałe księgowane automatycznie co miesiąc (F9).
 * Pola harmonogramu (period, startDate, endDate, isActive) są zgodne z ScheduleRule
 * z modułu subskrypcji, więc daty wpływów liczy ta sama funkcja getOccurrences.
 */
export interface RecurringIncome {
  id: string;
  /** Zawsze > 0, 2 miejsca po przecinku. */
  amount: number;
  /** Kategoria przychodów (domyślnie „Wynagrodzenie”). */
  categoryId: string;
  /** Pensja wpływa co miesiąc. */
  period: "monthly";
  /** YYYY-MM-DD: pierwszy wpływ. Dzień miesiąca bierzemy stąd (31. → ostatni dzień krótszego miesiąca). */
  startDate: string;
  /** YYYY-MM-DD albo null — bezterminowo. */
  endDate: string | null;
  /** false = wstrzymane: nic się nie księguje, a po wznowieniu nie wracają wpływy z pauzy. */
  isActive: boolean;
  note: string;
  /** ISO timestamp utworzenia. */
  createdAt: string;
  /**
   * Do kiedy (włącznie) wpływy zostały już rozliczone; null = jeszcze nigdy.
   * Dzięki temu ręcznie usunięty wpływ nie wraca po odświeżeniu strony.
   */
  generatedThrough: string | null;
}

/** Dane potrzebne do utworzenia cyklicznego przychodu (już po walidacji formularza). */
export interface NewRecurringIncome {
  amount: number;
  categoryId: string;
  /** Data pierwszego wpływu (YYYY-MM-DD). */
  startDate: string;
  note: string;
}

/** Stan wynagrodzenia względem dzisiejszej daty. */
export type RecurringIncomeStatus = "active" | "paused";
