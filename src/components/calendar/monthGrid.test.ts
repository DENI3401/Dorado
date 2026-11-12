import { describe, expect, it } from "vitest";
import { addMonths, buildMonthGrid, monthOf, monthRange, sameMonth } from "./monthGrid";

describe("monthRange", () => {
  it("zwraca pierwszy i ostatni dzień miesiąca", () => {
    expect(monthRange({ year: 2026, month: 11 })).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(monthRange({ year: 2028, month: 2 })).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(monthRange({ year: 2027, month: 2 })).toEqual({ from: "2027-02-01", to: "2027-02-28" });
  });
});

describe("addMonths", () => {
  it("przechodzi przez granicę roku w obu kierunkach", () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths({ year: 2026, month: 5 }, 0)).toEqual({ year: 2026, month: 5 });
  });
});

describe("monthOf i sameMonth", () => {
  it("czyta miesiąc z daty ISO", () => {
    expect(monthOf("2026-11-09")).toEqual({ year: 2026, month: 11 });
    expect(sameMonth(monthOf("2026-11-09"), { year: 2026, month: 11 })).toBe(true);
    expect(sameMonth(monthOf("2026-11-09"), { year: 2025, month: 11 })).toBe(false);
  });
});

describe("buildMonthGrid", () => {
  it("zaczyna tydzień od poniedziałku (listopad 2026 zaczyna się w niedzielę)", () => {
    const grid = buildMonthGrid({ year: 2026, month: 11 });
    expect(grid.length).toBe(6);
    expect(grid[0][0]).toEqual({ iso: "2026-10-26", day: 26, inMonth: false });
    expect(grid[0][6]).toEqual({ iso: "2026-11-01", day: 1, inMonth: true });
    expect(grid[5][0]).toEqual({ iso: "2026-11-30", day: 30, inMonth: true });
    expect(grid[5][1]).toEqual({ iso: "2026-12-01", day: 1, inMonth: false });
  });

  it("nie dodaje pustych tygodni, gdy luty zaczyna się w poniedziałek (2027)", () => {
    const grid = buildMonthGrid({ year: 2027, month: 2 });
    expect(grid.length).toBe(4);
    expect(grid[0][0]).toEqual({ iso: "2027-02-01", day: 1, inMonth: true });
    expect(grid[3][6]).toEqual({ iso: "2027-02-28", day: 28, inMonth: true });
    expect(grid.flat().every((cell) => cell.inMonth)).toBe(true);
  });

  it("zawiera 29 lutego w roku przestępnym i każdy tydzień ma 7 dni", () => {
    const grid = buildMonthGrid({ year: 2028, month: 2 });
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid.flat().some((cell) => cell.iso === "2028-02-29" && cell.inMonth)).toBe(true);
  });
});
