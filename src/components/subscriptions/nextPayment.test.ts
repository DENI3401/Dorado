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

  it("„za 2 dni” przez granicę miesiąca (czynsz 30.11 widziany 28.11)", () => {
    expect(describeRelativeDay("2026-11-30", "2026-11-28")).toBe("za 2 dni");
    expect(describeRelativeDay("2026-12-01", "2026-11-28")).toBe("za 3 dni");
  });

  it("data z przeszłości (np. karta otwarta przez noc) nie daje ujemnej liczby dni", () => {
    expect(describeRelativeDay("2026-11-10", "2026-11-11")).toBe("dzisiaj");
  });
});
