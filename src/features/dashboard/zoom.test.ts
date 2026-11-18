import { describe, expect, it } from "vitest";
import { aggregateByDay, type DailyCashflow } from "./aggregate";
import {
  cashflowYDomain,
  EMPTY_Y_MAX,
  getZoomedView,
  niceAxisMax,
  normalizeZoomRange,
  zoomFromDates,
} from "./zoom";

const NOV = { start: "2026-11-01", end: "2026-11-30" };

/** Cykl listopadowy: pensja 5400 zł 10-go, małe wydatki w kilku dniach, dni 20–25 bez operacji. */
function novemberData(): DailyCashflow[] {
  const days = aggregateByDay([], NOV);
  const set = (day: number, income: number, expense: number) => Object.assign(days[day - 1], { income, expense });
  set(4, 1629, 129.99);
  set(10, 5400, 1650);
  set(11, 0, 88.3);
  set(12, 0, 49.99);
  set(14, 350.5, 76);
  set(16, 0, 19.9);
  return days;
}

describe("normalizeZoomRange", () => {
  it("zakres jednego dnia", () => {
    expect(normalizeZoomRange(9, 9, 30)).toEqual({ startIndex: 9, endIndex: 9 });
  });

  it("zakres odwrócony (od prawej do lewej) daje ten sam wynik", () => {
    expect(normalizeZoomRange(15, 10, 30)).toEqual({ startIndex: 10, endIndex: 15 });
    expect(normalizeZoomRange(15, 10, 30)).toEqual(normalizeZoomRange(10, 15, 30));
  });

  it("przycina indeksy do danych", () => {
    expect(normalizeZoomRange(-3, 4, 30)).toEqual({ startIndex: 0, endIndex: 4 });
    expect(normalizeZoomRange(25, 99, 30)).toEqual({ startIndex: 25, endIndex: 29 });
  });

  it("cały cykl albo brak danych = brak powiększenia (null)", () => {
    expect(normalizeZoomRange(0, 29, 30)).toBeNull();
    expect(normalizeZoomRange(29, 0, 30)).toBeNull();
    expect(normalizeZoomRange(0, 0, 0)).toBeNull();
    expect(normalizeZoomRange(Number.NaN, 3, 30)).toBeNull();
  });
});

describe("zoomFromDates", () => {
  const data = novemberData();

  it("zamienia daty zaznaczenia na indeksy, także od prawej do lewej", () => {
    expect(zoomFromDates(data, "2026-11-16", "2026-11-11")).toEqual({ startIndex: 10, endIndex: 15 });
    expect(zoomFromDates(data, "2026-11-11", "2026-11-16")).toEqual({ startIndex: 10, endIndex: 15 });
  });

  it("jeden dzień", () => {
    expect(zoomFromDates(data, "2026-11-12", "2026-11-12")).toEqual({ startIndex: 11, endIndex: 11 });
  });

  it("data spoza cyklu nie zmienia powiększenia", () => {
    expect(zoomFromDates(data, "2026-10-31", "2026-11-05")).toBeNull();
  });
});

describe("niceAxisMax", () => {
  it("zaokrągla w górę jak Recharts (5 etykiet)", () => {
    expect(niceAxisMax(5400)).toBe(6000); // 0 / 1,5 / 3 / 4,5 / 6 tys.
    expect(niceAxisMax(6000)).toBe(6000);
    expect(niceAxisMax(350.5)).toBe(360);
    expect(niceAxisMax(49.99)).toBe(60);
    expect(niceAxisMax(1629)).toBe(1800);
    expect(niceAxisMax(7.5)).toBe(8);
    expect(niceAxisMax(0.3)).toBe(0.3); // krok 0,075 — tak samo jak w Recharts
  });

  it("zero / brak kwot daje domyślne maksimum", () => {
    expect(niceAxisMax(0)).toBe(EMPTY_Y_MAX);
  });
});

describe("cashflowYDomain", () => {
  it("bierze największą kwotę z przychodów i wydatków", () => {
    expect(cashflowYDomain(novemberData())).toEqual([0, 6000]);
  });

  it("dni bez operacji i pusta lista dają domyślną skalę (nie 0–0)", () => {
    expect(cashflowYDomain(aggregateByDay([], NOV))).toEqual([0, EMPTY_Y_MAX]);
    expect(cashflowYDomain([])).toEqual([0, EMPTY_Y_MAX]);
  });
});

describe("getZoomedView", () => {
  const data = novemberData();

  it("bez powiększenia (reset) pokazuje cały cykl ze skalą wg pensji", () => {
    const view = getZoomedView(data, null);
    expect(view.isZoomed).toBe(false);
    expect(view.data).toHaveLength(30);
    expect(view.data).toEqual(data);
    expect([view.startIndex, view.endIndex]).toEqual([0, 29]);
    expect(view.yDomain).toEqual([0, 6000]);
  });

  it("reset po powiększeniu wraca do pełnego widoku", () => {
    const zoomed = getZoomedView(data, { startIndex: 10, endIndex: 15 });
    expect(zoomed.isZoomed).toBe(true);
    expect(getZoomedView(data, null)).toEqual(getZoomedView(data, normalizeZoomRange(0, 29, data.length)));
  });

  it("po powiększeniu skala Y liczy się tylko z widocznych dni", () => {
    const view = getZoomedView(data, { startIndex: 10, endIndex: 15 });
    expect(view.data.map((d) => d.day)).toEqual([11, 12, 13, 14, 15, 16]);
    // Bez powiększenia oś sięga 6000 zł (pensja); po powiększeniu — 360 zł (premia 350,50 zł).
    expect(view.yDomain).toEqual([0, 360]);
  });

  it("zakres jednego dnia", () => {
    const view = getZoomedView(data, { startIndex: 11, endIndex: 11 });
    expect(view.isZoomed).toBe(true);
    expect(view.data).toEqual([data[11]]);
    expect(view.yDomain).toEqual([0, 60]);
  });

  it("zakres odwrócony jest porządkowany", () => {
    const view = getZoomedView(data, { startIndex: 15, endIndex: 10 });
    expect([view.startIndex, view.endIndex]).toEqual([10, 15]);
    expect(view.data[0].day).toBe(11);
  });

  it("zakres bez danych (dni bez operacji) — domyślna skala Y, wykres nadal powiększony", () => {
    const view = getZoomedView(data, { startIndex: 19, endIndex: 24 });
    expect(view.isZoomed).toBe(true);
    expect(view.data.map((d) => d.day)).toEqual([20, 21, 22, 23, 24, 25]);
    expect(view.data.every((d) => d.income === 0 && d.expense === 0)).toBe(true);
    expect(view.yDomain).toEqual([0, EMPTY_Y_MAX]);
  });

  it("brak danych w cyklu — pusty, niepowiększony widok", () => {
    const view = getZoomedView([], { startIndex: 2, endIndex: 5 });
    expect(view).toEqual({ data: [], startIndex: 0, endIndex: 0, yDomain: [0, EMPTY_Y_MAX], isZoomed: false });
  });

  it("zakres przestarzały (dłuższy niż nowe dane) jest przycinany", () => {
    const short = data.slice(0, 10);
    const view = getZoomedView(short, { startIndex: 5, endIndex: 25 });
    expect([view.startIndex, view.endIndex]).toEqual([5, 9]);
  });
});
