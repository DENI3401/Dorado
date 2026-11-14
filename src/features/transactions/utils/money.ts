/** Maksymalna dozwolona kwota pojedynczej operacji. */
export const MAX_AMOUNT = 1_000_000_000;

/** Zaokrągla do 2 miejsc po przecinku (symetrycznie dla liczb ujemnych). */
export function roundMoney(value: number): number {
  const abs = Math.abs(value);
  const rounded = Math.round((abs + Number.EPSILON) * 100) / 100;
  return value < 0 ? -rounded : rounded;
}

/**
 * Parsuje kwotę wpisaną przez użytkownika: "1 234,50", "12.5", "99 zł".
 * Zwraca null, gdy tekst nie jest poprawną liczbą.
 */
export function parseAmount(input: string): number | null {
  const cleaned = input
    .replace(/[\s\u00a0]/g, "")
    .replace(/(zł|pln)$/i, "")
    .replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const plnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
});

export function formatPLN(amount: number): string {
  return plnFormatter.format(amount);
}
