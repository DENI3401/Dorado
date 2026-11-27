import { describe, expect, it } from "vitest";
import { addDaysIso } from "@/features/subscriptions/schedule";
import type { Transaction } from "@/features/transactions/types";
import {
  getCycleBalance,
  getCycleRange,
  getOpeningBalance,
  getPreviousCycleRange,
  normalizeStartDay,
} from "./cycle";

let seq = 0;
const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: `t${++seq}`,
  type: "expense",
  incomeKind: null,
  amount: 10,
  categoryId: "cat-expense-food",
  date: "2026-11-05",
  note: "",
  createdAt: "2026-11-05T10:00:00.000Z",
  ...over,
});
const income = (over: Partial<Transaction> = {}): Transaction =>
  tx({ type: "income", incomeKind: "salary", categoryId: "cat-income-salary", ...over });

describe("getCycleRange", () => {
  const cases: [string, string, number, string, string][] = [
    ["zwykły miesiąc (start 1.)", "2026-11-23", 1, "2026-11-01", "2026-11-30"],
    ["środek miesiąca (start 15.)", "2026-11-23", 15, "2026-11-15", "2026-12-14"],
    ["przed dniem startu", "2026-11-10", 15, "2026-10-15", "2026-11-14"],
    ["dokładnie w dniu startu", "2026-11-15", 15, "2026-11-15", "2026-12-14"],
    ["ostatni dzień cyklu", "2026-12-14", 15, "2026-11-15", "2026-12-14"],
    ["krótki miesiąc, przed startem 31.", "2026-02-10", 31, "2026-01-31", "2026-02-27"],
    ["krótki miesiąc, start 31. wypada 28.", "2026-02-28", 31, "2026-02-28", "2026-03-30"],
    ["przełom roku", "2027-01-05", 15, "2026-12-15", "2027-01-14"],
    ["rok nieprzestępny, start 29.", "2027-02-28", 29, "2027-02-28", "2027-03-28"],
    ["rok przestępny, start 1.", "2028-02-10", 1, "2028-02-01", "2028-02-29"],
    ["rok przestępny, start 29.", "2028-02-29", 29, "2028-02-29", "2028-03-28"],
  ];
  for (const [name, today, startDay, start, end] of cases) {
    it(`${name}: ${today}, start ${startDay} → ${start} … ${end}`, () => {
      expect(getCycleRange(today, startDay)).toEqual({ start, end });
    });
  }

  it("cykle są ciągłe i bez luk dla każdego dnia startu (2026–2027)", () => {
    const problems: string[] = [];
    for (const startDay of [1, 15, 28, 29, 30, 31]) {
      for (let date = "2026-01-01"; date <= "2027-12-31"; date = addDaysIso(date, 1)) {
        const range = getCycleRange(date, startDay);
        const nextDay = addDaysIso(range.end, 1);
        const inside = date >= range.start && date <= range.end;
        const continuous = getCycleRange(nextDay, startDay).start === nextDay;
        if (!inside || !continuous) problems.push(`${date} / ${startDay}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("niepoprawny dzień startu traktuje bezpiecznie", () => {
    expect(getCycleRange("2026-11-23", 0)).toEqual(getCycleRange("2026-11-23", 1));
    expect(getCycleRange("2026-11-23", 45)).toEqual(getCycleRange("2026-11-23", 31));
    expect(getCycleRange("2026-11-23", Number.NaN)).toEqual(getCycleRange("2026-11-23", 1));
  });
});

describe("normalizeStartDay", () => {
  it("zwraca liczbę całkowitą z zakresu 1–31", () => {
    expect(normalizeStartDay(15)).toBe(15);
    expect(normalizeStartDay(15.7)).toBe(15);
    expect(normalizeStartDay(0)).toBe(1);
    expect(normalizeStartDay(-3)).toBe(1);
    expect(normalizeStartDay(99)).toBe(31);
    expect(normalizeStartDay(Number.NaN)).toBe(1);
  });
});

describe("getPreviousCycleRange", () => {
  it("zwraca cykl bezpośrednio przed podanym", () => {
    const current = getCycleRange("2026-11-23", 15);
    expect(getPreviousCycleRange(current, 15)).toEqual({ start: "2026-10-15", end: "2026-11-14" });
  });

  it("działa przy dniu startu 31. i krótkim miesiącu", () => {
    const march = getCycleRange("2026-03-31", 31);
    expect(march).toEqual({ start: "2026-03-31", end: "2026-04-29" });
    expect(getPreviousCycleRange(march, 31)).toEqual({ start: "2026-02-28", end: "2026-03-30" });
  });
});

describe("getOpeningBalance", () => {
  it("sumuje wszystko sprzed początku cyklu", () => {
    const list = [
      income({ amount: 1000, date: "2026-10-10" }),
      tx({ amount: 300, date: "2026-10-20" }),
      income({ amount: 200, date: "2026-11-03" }),
    ];
    expect(getOpeningBalance(list, "2026-11-01")).toBe(700);
  });

  it("niedobór z poprzedniego cyklu to ujemne saldo otwarcia", () => {
    const list = [tx({ amount: 400, date: "2026-10-05" }), income({ amount: 100, date: "2026-10-06" })];
    expect(getOpeningBalance(list, "2026-11-01")).toBe(-300);
  });

  it("transakcja dokładnie w dniu startu należy do nowego cyklu, nie do salda otwarcia", () => {
    expect(getOpeningBalance([income({ amount: 50, date: "2026-11-01" })], "2026-11-01")).toBe(0);
    expect(getOpeningBalance([income({ amount: 50, date: "2026-10-31" })], "2026-11-01")).toBe(50);
  });

  it("bez transakcji = 0", () => {
    expect(getOpeningBalance([], "2026-11-01")).toBe(0);
  });
});

describe("getCycleBalance", () => {
  const NOV = { start: "2026-11-01", end: "2026-11-30" };

  it("rollover: przychód 1000 i wydatek 300 w październiku, przychód 200 w listopadzie", () => {
    const list = [
      income({ amount: 1000, date: "2026-10-10" }),
      tx({ amount: 300, date: "2026-10-20" }),
      income({ amount: 200, date: "2026-11-03" }),
    ];
    expect(getCycleBalance(list, NOV)).toEqual({
      opening: 700,
      income: 200,
      expense: 0,
      balance: 900,
    });
  });

  it("dług z poprzedniego cyklu jest przenoszony jako ujemne saldo otwarcia", () => {
    const list = [
      tx({ amount: 400, date: "2026-10-05" }),
      income({ amount: 100, date: "2026-10-06" }),
      income({ amount: 1000, date: "2026-11-02" }),
      tx({ amount: 100, date: "2026-11-04" }),
    ];
    expect(getCycleBalance(list, NOV)).toEqual({
      opening: -300,
      income: 1000,
      expense: 100,
      balance: 600,
    });
  });

  it("granice cyklu są włącznie, operacje po końcu cyklu są pomijane", () => {
    const list = [
      income({ amount: 50, date: "2026-11-01" }),
      tx({ amount: 20, date: "2026-11-30" }),
      income({ amount: 999, date: "2026-12-01" }),
    ];
    expect(getCycleBalance(list, NOV)).toEqual({ opening: 0, income: 50, expense: 20, balance: 30 });
  });

  it("zaokrągla sumy float: 0,1 + 0,2 = 0,3", () => {
    const list = [income({ amount: 0.1, date: "2026-10-01" }), income({ amount: 0.2, date: "2026-10-02" })];
    expect(getCycleBalance(list, NOV).opening).toBe(0.3);

    const inCycle = [income({ amount: 0.1 }), income({ amount: 0.2 })];
    const result = getCycleBalance(inCycle, NOV);
    expect(result.income).toBe(0.3);
    expect(result.balance).toBe(0.3);
  });

  it("własny dzień cyklu (od 15.): saldo otwarcia liczone od 15.", () => {
    const list = [
      income({ amount: 500, date: "2026-11-10" }),
      income({ amount: 100, date: "2026-11-20" }),
      tx({ amount: 30, date: "2026-11-22" }),
    ];
    const range = getCycleRange("2026-11-23", 15);
    expect(getCycleBalance(list, range)).toEqual({
      opening: 500,
      income: 100,
      expense: 30,
      balance: 570,
    });
  });

  it("zmiana dnia cyklu nie traci pieniędzy: saldo na koniec jest to samo", () => {
    const list = [
      income({ amount: 1000, date: "2026-10-03" }),
      tx({ amount: 200, date: "2026-10-18" }),
      tx({ amount: 50, date: "2026-11-04" }),
    ];
    const byFirst = getCycleBalance(list, getCycleRange("2026-11-30", 1));
    const byFifteenth = getCycleBalance(list, getCycleRange("2026-11-14", 15));
    // oba cykle obejmują wszystkie trzy operacje: opening + cykl = to samo saldo całkowite
    expect(byFirst.balance).toBe(750);
    expect(byFifteenth.balance).toBe(750);
  });

  it("brak transakcji = same zera", () => {
    expect(getCycleBalance([], NOV)).toEqual({ opening: 0, income: 0, expense: 0, balance: 0 });
  });
});
