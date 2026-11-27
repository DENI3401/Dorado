import { describe, expect, it } from "vitest";
import { isBelowThreshold, shouldNotifyLowBalance, type LowBalanceCheckInput } from "./lowBalance";

const base: LowBalanceCheckInput = {
  balance: 300,
  threshold: 500,
  triggered: false,
  alertCycleStart: null,
  cycleStart: "2026-11-01",
};

describe("isBelowThreshold", () => {
  it("saldo ściśle poniżej progu → true", () => {
    expect(isBelowThreshold(499.99, 500)).toBe(true);
    expect(isBelowThreshold(-20, 500)).toBe(true);
  });

  it("saldo równe progowi lub wyższe → false", () => {
    expect(isBelowThreshold(500, 500)).toBe(false);
    expect(isBelowThreshold(900, 500)).toBe(false);
  });

  it("próg 0 wyłącza alert, nawet przy ujemnym saldzie", () => {
    expect(isBelowThreshold(-100, 0)).toBe(false);
    expect(isBelowThreshold(0, 0)).toBe(false);
  });
});

describe("shouldNotifyLowBalance", () => {
  it("saldo poniżej progu i flaga nieaktywna → true", () => {
    expect(shouldNotifyLowBalance(base)).toBe(true);
  });

  it("saldo równe progowi lub wyższe → false", () => {
    expect(shouldNotifyLowBalance({ ...base, balance: 500 })).toBe(false);
    expect(shouldNotifyLowBalance({ ...base, balance: 800 })).toBe(false);
  });

  it("próg 0 = alert wyłączony", () => {
    expect(shouldNotifyLowBalance({ ...base, threshold: 0, balance: -50 })).toBe(false);
  });

  it("powtórnie w tym samym cyklu → false (Trigger Once)", () => {
    expect(
      shouldNotifyLowBalance({ ...base, triggered: true, alertCycleStart: "2026-11-01" }),
    ).toBe(false);
  });

  it("nowy cykl → true, mimo że flaga z poprzedniego cyklu jest ustawiona", () => {
    expect(
      shouldNotifyLowBalance({ ...base, triggered: true, alertCycleStart: "2026-10-01" }),
    ).toBe(true);
  });

  it("flaga ustawiona bez zapisanego cyklu nie blokuje alertu", () => {
    expect(shouldNotifyLowBalance({ ...base, triggered: true, alertCycleStart: null })).toBe(true);
  });

  it("force → true nawet z aktywną flagą w tym samym cyklu", () => {
    expect(
      shouldNotifyLowBalance({
        ...base,
        triggered: true,
        alertCycleStart: "2026-11-01",
        force: true,
      }),
    ).toBe(true);
  });

  it("force nie omija progu: saldo powyżej progu → false", () => {
    expect(shouldNotifyLowBalance({ ...base, balance: 900, force: true })).toBe(false);
    expect(shouldNotifyLowBalance({ ...base, threshold: 0, force: true })).toBe(false);
  });
});
