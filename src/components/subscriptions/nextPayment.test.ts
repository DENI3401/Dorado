import { describe, expect, it } from "vitest";
import { daysBetween, describeRelativeDay } from "./nextPayment";

describe("daysBetween", () => {
  it("liczy dni przez granicę miesiąca i roku", () => {
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("uwzględnia rok przestępny", () => {
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
    expect(daysBetween("2027-02-28", "2027-03-01")).toBe(1);
  });

  it("nie zależy od zmiany czasu", () => {
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
  });
});

describe("describeRelativeDay", () => {
  it("opisuje dzisiaj, jutro i kolejne dni", () => {
    expect(describeRelativeDay("2026-11-11", "2026-11-11")).toBe("dzisiaj");
    expect(describeRelativeDay("2026-11-12", "2026-11-11")).toBe("jutro");
    expect(describeRelativeDay("2026-11-21", "2026-11-11")).toBe("za 10 dni");
  });
});
