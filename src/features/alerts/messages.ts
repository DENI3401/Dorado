import { formatPLN } from "@/features/transactions/utils/money";

/**
 * Tekst alertu niskiego salda. `spent` — suma wydatków w cyklu, `left` — saldo cyklu
 * z rollover (obie wartości z getCycleBalance).
 */
export function lowBalanceMessage(spent: number, left: number): string {
  return `Wydałeś już ${formatPLN(spent)}. Na Twoim koncie pozostało tylko ${formatPLN(left)}`;
}
