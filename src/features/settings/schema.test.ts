import { describe, expect, it } from "vitest";
import { cycleStartDaySchema, lowBalanceThresholdSchema, settingsFormSchema } from "./schema";

describe("cycleStartDaySchema", () => {
  it("przyjmuje dni 1–31 (tekst z selecta i liczby)", () => {
    expect(cycleStartDaySchema.parse("1")).toBe(1);
    expect(cycleStartDaySchema.parse("15")).toBe(15);
    expect(cycleStartDaySchema.parse("31")).toBe(31);
    expect(cycleStartDaySchema.parse(28)).toBe(28);
  });

  it("odrzuca 0 i 32", () => {
    expect(cycleStartDaySchema.safeParse("0").success).toBe(false);
    expect(cycleStartDaySchema.safeParse("32").success).toBe(false);
    expect(cycleStartDaySchema.safeParse(-1).success).toBe(false);
  });

  it("odrzuca liczby niecałkowite", () => {
    expect(cycleStartDaySchema.safeParse("1.5").success).toBe(false);
    expect(cycleStartDaySchema.safeParse(1.5).success).toBe(false);
  });

  it("odrzuca puste pole i tekst", () => {
    expect(cycleStartDaySchema.safeParse("").success).toBe(false);
    expect(cycleStartDaySchema.safeParse("   ").success).toBe(false);
    expect(cycleStartDaySchema.safeParse("abc").success).toBe(false);
  });

  it("zwraca komunikaty po polsku", () => {
    const zero = cycleStartDaySchema.safeParse("0");
    const empty = cycleStartDaySchema.safeParse("");
    const fraction = cycleStartDaySchema.safeParse("1.5");
    expect(zero.success ? "" : zero.error.issues[0].message).toBe(
      "Dzień cyklu musi być między 1 a 31",
    );
    expect(empty.success ? "" : empty.error.issues[0].message).toBe("Podaj dzień początku cyklu");
    expect(fraction.success ? "" : fraction.error.issues[0].message).toBe(
      "Dzień cyklu musi być liczbą całkowitą",
    );
  });
});

describe("lowBalanceThresholdSchema", () => {
  it("parsuje kwotę z przecinkiem: „750,50” → 750.5", () => {
    expect(lowBalanceThresholdSchema.parse("750,50")).toBe(750.5);
  });

  it("przyjmuje kropkę, spacje i sufiks „zł”", () => {
    expect(lowBalanceThresholdSchema.parse("750.5")).toBe(750.5);
    expect(lowBalanceThresholdSchema.parse("1 234,50")).toBe(1234.5);
    expect(lowBalanceThresholdSchema.parse("500 zł")).toBe(500);
  });

  it("przyjmuje 0 (alert wyłączony)", () => {
    expect(lowBalanceThresholdSchema.parse("0")).toBe(0);
    expect(lowBalanceThresholdSchema.parse(0)).toBe(0);
  });

  it("odrzuca ujemny próg", () => {
    expect(lowBalanceThresholdSchema.safeParse("-1").success).toBe(false);
    expect(lowBalanceThresholdSchema.safeParse(-0.01).success).toBe(false);
  });

  it("zaokrągla do 2 miejsc", () => {
    expect(lowBalanceThresholdSchema.parse("10,005")).toBe(10.01);
  });

  it("odrzuca zbyt duży próg, puste pole i tekst", () => {
    expect(lowBalanceThresholdSchema.safeParse("1000000001").success).toBe(false);
    expect(lowBalanceThresholdSchema.safeParse("").success).toBe(false);
    expect(lowBalanceThresholdSchema.safeParse("abc").success).toBe(false);
  });
});

describe("settingsFormSchema", () => {
  it("zamienia tekst z formularza na liczby", () => {
    expect(settingsFormSchema.parse({ cycleStartDay: "15", lowBalanceThreshold: "750,50" })).toEqual({
      cycleStartDay: 15,
      lowBalanceThreshold: 750.5,
    });
  });

  it("zgłasza błędy przy właściwych polach", () => {
    const result = settingsFormSchema.safeParse({ cycleStartDay: "32", lowBalanceThreshold: "-5" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("cycleStartDay");
      expect(paths).toContain("lowBalanceThreshold");
    }
  });
});
