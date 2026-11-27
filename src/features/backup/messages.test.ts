import { describe, expect, it } from "vitest";
import { backupContentsText, describeIssue, plural } from "./messages";

describe("plural", () => {
  it("odmienia rzeczownik po liczebniku", () => {
    const t = (n: number) => plural(n, "transakcja", "transakcje", "transakcji");
    expect(t(0)).toBe("0 transakcji");
    expect(t(1)).toBe("1 transakcja");
    expect(t(2)).toBe("2 transakcje");
    expect(t(4)).toBe("4 transakcje");
    expect(t(5)).toBe("5 transakcji");
    expect(t(12)).toBe("12 transakcji");
    expect(t(22)).toBe("22 transakcje");
    expect(t(114)).toBe("114 transakcji");
  });
});

describe("backupContentsText", () => {
  it("wylicza zawartość kopii", () => {
    expect(
      backupContentsText({
        exportedAt: "2026-11-27T12:00:00.000Z",
        transactions: 120,
        customCategories: 3,
        subscriptions: 4,
        recurringIncomes: 1,
      }),
    ).toBe("120 transakcji, 3 kategorie własne, 4 subskrypcje i 1 wynagrodzenie stałe");
  });
});

describe("describeIssue", () => {
  it("pola nagłówka zwracają sam komunikat", () => {
    expect(describeIssue({ code: "custom", path: ["app"], message: "To nie jest kopia", input: null })).toBe(
      "To nie jest kopia",
    );
  });

  it("tłumaczy ścieżkę na sekcję, pozycję i pole", () => {
    expect(
      describeIssue({
        code: "custom",
        path: ["data", "recurringIncomes", 0, "generatedThrough"],
        message: "Nieprawidłowa data",
        input: null,
      }),
    ).toBe("Wynagrodzenia stałe, pozycja 1, pole „rozliczone do”: Nieprawidłowa data");
  });
});
