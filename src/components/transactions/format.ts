const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "2026-11-03" → "3 lis 2026" (bez przesunięć stref czasowych). */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}
