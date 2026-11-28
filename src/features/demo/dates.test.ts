import { describe, expect, it } from "vitest";
import { resolveRelativeDate } from "./dates";

describe("resolveRelativeDate — daysAgo", () => {
  it("0 = dziś, 1 = wczoraj", () => {
    expect(resolveRelativeDate({ daysAgo: 0 }, "2026-11-28")).toBe("2026-11-28");
    expect(resolveRelativeDate({ daysAgo: 1 }, "2026-11-28")).toBe("2026-11-27");
  });

  it("przechodzi przez granicę miesiąca, roku i 29 lutego", () => {
    expect(resolveRelativeDate({ daysAgo: 1 }, "2026-03-01")).toBe("2026-02-28");
    expect(resolveRelativeDate({ daysAgo: 1 }, "2028-03-01")).toBe("2028-02-29");
    expect(resolveRelativeDate({ daysAgo: 1 }, "2027-01-01")).toBe("2026-12-31");
    expect(resolveRelativeDate({ daysAgo: 100 }, "2026-11-28")).toBe("2026-08-20");
  });
});

describe("resolveRelativeDate — monthsAgo + day", () => {
  it("dzień miesiąca sprzed N miesięcy", () => {
    expect(resolveRelativeDate({ monthsAgo: 3, day: 10 }, "2026-11-28")).toBe("2026-08-10");
    expect(resolveRelativeDate({ monthsAgo: 0, day: 1 }, "2026-11-28")).toBe("2026-11-01");
  });

  it("cofa się przez granicę roku", () => {
    expect(resolveRelativeDate({ monthsAgo: 11, day: 20 }, "2026-11-28")).toBe("2025-12-20");
    expect(resolveRelativeDate({ monthsAgo: 13, day: 5 }, "2026-01-15")).toBe("2024-12-05");
  });

  it("ujemne monthsAgo to przyszłość", () => {
    expect(resolveRelativeDate({ monthsAgo: -2, day: 15 }, "2026-11-28")).toBe("2027-01-15");
  });

  it("dzień 31 w krótszym miesiącu → 31. dzień miesiąc wcześniej (a nie 30.)", () => {
    expect(resolveRelativeDate({ monthsAgo: 0, day: 31 }, "2026-11-28")).toBe("2026-10-31");
    expect(resolveRelativeDate({ monthsAgo: 2, day: 31 }, "2026-11-28")).toBe("2026-08-31");
    expect(resolveRelativeDate({ monthsAgo: 3, day: 31 }, "2026-11-28")).toBe("2026-08-31");
    expect(resolveRelativeDate({ monthsAgo: 0, day: 31 }, "2026-02-10")).toBe("2026-01-31");
  });

  it("29 i 30 lutego: rok przestępny i nieprzestępny", () => {
    expect(resolveRelativeDate({ monthsAgo: 1, day: 29 }, "2028-03-10")).toBe("2028-02-29");
    expect(resolveRelativeDate({ monthsAgo: 1, day: 29 }, "2027-03-10")).toBe("2027-01-29");
    expect(resolveRelativeDate({ monthsAgo: 1, day: 30 }, "2028-03-10")).toBe("2028-01-30");
  });
});
