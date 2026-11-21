/**
 * Czysta logika powiększania wykresu „Przychody i wydatki” (bez Reacta i Recharts).
 * Zakres to indeksy dni w danych cyklu (wynik aggregateByDay), obie granice włącznie.
 */
import type { DailyCashflow } from "./aggregate";

export interface ZoomRange {
  startIndex: number;
  endIndex: number;
}

export interface ZoomedView {
  /** Dni widoczne na wykresie (cały cykl, gdy brak powiększenia). */
  data: DailyCashflow[];
  /** Indeksy widocznych dni w pełnych danych — dla suwaka (Brush). */
  startIndex: number;
  endIndex: number;
  /** Domena osi Y liczona tylko z widocznych dni. */
  yDomain: [number, number];
  isZoomed: boolean;
}

/**
 * Porządkuje zaznaczenie (przeciągnięcie od prawej do lewej daje ten sam zakres)
 * i przycina je do danych. Zwraca null, gdy nie ma czego powiększać: brak danych
 * albo zakres obejmuje cały cykl — wtedy wykres jest „niepowiększony”.
 */
export function normalizeZoomRange(from: number, to: number, length: number): ZoomRange | null {
  if (length <= 0 || !Number.isFinite(from) || !Number.isFinite(to)) return null;
  const clamp = (i: number) => Math.min(length - 1, Math.max(0, Math.round(i)));
  const a = clamp(from);
  const b = clamp(to);
  const range = { startIndex: Math.min(a, b), endIndex: Math.max(a, b) };
  return range.startIndex === 0 && range.endIndex === length - 1 ? null : range;
}

/**
 * Zakres z zaznaczenia myszą: daty YYYY-MM-DD dnia początkowego i końcowego,
 * w dowolnej kolejności. Nieznana data (np. puszczenie poza wykresem) = brak zmiany.
 */
export function zoomFromDates(
  data: readonly DailyCashflow[],
  fromDate: string,
  toDate: string,
): ZoomRange | null {
  const from = data.findIndex((d) => d.date === fromDate);
  const to = data.findIndex((d) => d.date === toDate);
  if (from < 0 || to < 0) return null;
  return normalizeZoomRange(from, to, data.length);
}

/** Liczba etykiet osi Y (domyślna w Recharts). */
export const Y_TICK_COUNT = 5;
/** Górna granica osi Y, gdy w widocznych dniach nie ma żadnych kwot (oś nie może być 0–0). */
export const EMPTY_Y_MAX = 100;

/**
 * Zaokrągla maksimum osi w górę do „ładnej” wartości tak samo jak Recharts przy domenie
 * automatycznej (krok = rough step zaokrąglony do 0,05 / 0,1 rzędu wielkości), np. 5400 → 6000
 * (co 1500), 350,5 → 360 (co 90). Dzięki temu widok bez powiększenia wygląda jak dotąd.
 */
export function niceAxisMax(max: number, tickCount = Y_TICK_COUNT): number {
  if (!(max > 0)) return EMPTY_Y_MAX;
  const roughStep = max / (tickCount - 1);
  const digits = Math.floor(Math.log10(roughStep)) + 1;
  const magnitude = 10 ** digits;
  const scale = digits !== 1 ? 0.05 : 0.1;
  // −1e-9: 0,15 / 0,05 w float to 2,9999…, a nie 3.
  const ratio = Math.ceil(roughStep / magnitude / scale - 1e-9) * scale;
  return Number((ratio * magnitude * (tickCount - 1)).toPrecision(12));
}

/**
 * Domena osi Y [0, max] liczona tylko z podanych (widocznych) dni: największa kwota
 * przychodu albo wydatku, zaokrąglona w górę przez niceAxisMax.
 */
export function cashflowYDomain(days: readonly DailyCashflow[]): [number, number] {
  let max = 0;
  for (const d of days) max = Math.max(max, d.income, d.expense);
  return [0, niceAxisMax(max)];
}

/**
 * Widok wykresu dla danego powiększenia. `zoom = null` to reset — cały cykl.
 * Zakres jest ponownie normalizowany, więc przestarzały (np. po zmianie danych) nie wyjdzie poza dane.
 */
export function getZoomedView(data: readonly DailyCashflow[], zoom: ZoomRange | null): ZoomedView {
  const range = zoom ? normalizeZoomRange(zoom.startIndex, zoom.endIndex, data.length) : null;
  const startIndex = range?.startIndex ?? 0;
  const endIndex = range?.endIndex ?? Math.max(0, data.length - 1);
  const visible = data.slice(startIndex, endIndex + 1);
  return {
    data: visible,
    startIndex,
    endIndex,
    yDomain: cashflowYDomain(visible),
    isZoomed: range !== null,
  };
}
