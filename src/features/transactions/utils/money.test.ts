import { describe, expect, it } from "vitest";
import { parseAmount, roundMoney } from "./money";

describe("roundMoney", () => {
  it("zaokrągla do 2 miejsc", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(2.675)).toBe(2.68);
    expect(roundMoney(10)).toBe(10);
  });
  it("jest symetryczne dla liczb ujemnych", () => {
    expect(roundMoney(-2.675)).toBe(-2.68);
  });
});

describe("parseAmount", () => {
  it("obsługuje przecinek, spacje i sufiks zł", () => {
    expect(parseAmount("1 234,50")).toBe(1234.5);
    expect(parseAmount("12.5")).toBe(12.5);
    expect(parseAmount("99 zł")).toBe(99);
  });
  it("zwraca null dla śmieci", () => {
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("1,2,3")).toBeNull();
  });
  it("przepuszcza liczby ujemne (odrzuca je dopiero schemat Zod)", () => {
    expect(parseAmount("-5")).toBe(-5);
  });
});
