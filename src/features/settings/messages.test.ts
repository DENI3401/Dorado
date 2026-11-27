import { describe, expect, it } from "vitest";
import {
  confirmCycleChangeText,
  currentCycleMessage,
  formatCycleRange,
  thresholdStatusMessage,
} from "./messages";

const range = { start: "2026-10-15", end: "2026-11-14" };

describe("formatCycleRange", () => {
  it("formatuje zakres jako dd.mm–dd.mm", () => {
    expect(formatCycleRange(range)).toBe("15.10–14.11");
    expect(formatCycleRange({ start: "2026-12-01", end: "2026-12-31" })).toBe("01.12–31.12");
  });
});

describe("confirmCycleChangeText", () => {
  it("pokazuje nowy cykl i zapewnia, że historia się nie zmieni", () => {
    expect(confirmCycleChangeText(range)).toBe(
      "Nowy cykl: 15.10–14.11. Historia transakcji się nie zmieni, saldo otwarcia zostanie przeliczone.",
    );
  });
});

describe("currentCycleMessage", () => {
  it("składa podgląd z zakresu i salda otwarcia", () => {
    expect(currentCycleMessage({ start: "2026-11-15", end: "2026-12-14" }, 700)).toMatch(
      /^Bieżący cykl: 15\.11–14\.12, saldo otwarcia: 700,00\s?zł$/,
    );
  });
});

describe("thresholdStatusMessage", () => {
  it("opisuje wyłączony alert, saldo poniżej i powyżej progu", () => {
    expect(thresholdStatusMessage({ threshold: 0, isBelow: false })).toBe("Alert jest wyłączony.");
    expect(thresholdStatusMessage({ threshold: 500, isBelow: true })).toMatch(/od razu po zapisaniu/);
    expect(thresholdStatusMessage({ threshold: 500, isBelow: false })).toMatch(/nie zadziała/);
  });
});
