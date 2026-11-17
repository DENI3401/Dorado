export type BillingPeriod = "monthly" | "yearly";

export interface Subscription {
  id: string;
  name: string;
  /** Zawsze > 0, 2 miejsca po przecinku. */
  amount: number;
  /** Kategoria wydatków; domyślnie SUBSCRIPTIONS_CATEGORY_ID. */
  categoryId: string;
  period: BillingPeriod;
  /** YYYY-MM-DD. Dzień miesiąca (monthly) albo dzień i miesiąc (yearly) bierzemy stąd. */
  startDate: string;
  /** YYYY-MM-DD albo null — subskrypcja bezterminowa (włącznie). */
  endDate: string | null;
  /** false = wstrzymana: płatności nie są generowane ani pokazywane w kalendarzu. */
  isActive: boolean;
  note: string;
  /** ISO timestamp utworzenia. */
  createdAt: string;
}

/** Stan subskrypcji względem dzisiejszej daty. */
export type SubscriptionStatus = "active" | "paused" | "ended";

export interface PaymentOccurrence {
  subscriptionId: string;
  subscription: Subscription;
  /** YYYY-MM-DD */
  date: string;
  amount: number;
  /** true, jeśli istnieje już transakcja z tym subscriptionId i tą datą. */
  paid: boolean;
}
