/**
 * Znacznik „pierwsze uruchomienie już było” w localStorage.
 *
 * Bez niego aplikacja po „Wyczyść dane demo” (albo po ręcznym usunięciu wszystkich operacji)
 * przy następnym starcie znów zobaczyłaby puste magazyny i wczytała demo od nowa.
 */
export const DEMO_STORAGE_KEY = "dorado-demo";

export interface DemoState {
  /** seeded — demo zostało wczytane; skipped — przy pierwszym starcie były już dane użytkownika. */
  status: "seeded" | "skipped";
  /** Dzień decyzji (YYYY-MM-DD). */
  date: string;
}

export function readDemoState(): DemoState | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(DEMO_STORAGE_KEY);
  } catch {
    // Brak localStorage (tryb prywatny): nic nie przetrwa odświeżenia, więc każdy start jest pierwszy.
    return null;
  }
  if (raw === null) return null;

  // Uszkodzony wpis traktujemy jak „decyzja już zapadła” — bezpieczniej niż nadpisać dane.
  const decided: DemoState = { status: "skipped", date: "" };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "status" in parsed &&
      (parsed.status === "seeded" || parsed.status === "skipped")
    ) {
      return parsed as DemoState;
    }
    return decided;
  } catch {
    return decided;
  }
}

export function writeDemoState(state: DemoState): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // brak zapisu (tryb prywatny) — bez localStorage i tak nic nie przetrwa odświeżenia
  }
}
