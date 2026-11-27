export interface BudgetSettings {
  /** Dzień początku cyklu, 1–31. W krótszym miesiącu cykl zaczyna się ostatniego dnia miesiąca. */
  cycleStartDay: number;
  /** Próg alertu niskiego salda w PLN, ≥ 0. 0 = alert wyłączony. */
  lowBalanceThreshold: number;
}

export const DEFAULT_SETTINGS: BudgetSettings = {
  cycleStartDay: 1,
  lowBalanceThreshold: 500,
};
