function parse(iso: string): number {
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

/** Liczba pełnych dni od `fromIso` do `toIso` (YYYY-MM-DD), bez stref czasowych. */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parse(toIso) - parse(fromIso)) / 86_400_000);
}

/** „dzisiaj”, „jutro”, „za 5 dni” — dla daty najbliższej płatności. */
export function describeRelativeDay(iso: string, todayIso: string): string {
  const days = daysBetween(todayIso, iso);
  if (days <= 0) return "dzisiaj";
  if (days === 1) return "jutro";
  return `za ${days} dni`;
}
