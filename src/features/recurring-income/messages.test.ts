import { describe, expect, it } from "vitest";
import { savedTransactionMessage } from "@/features/transactions/messages";
import { formatPLN } from "@/features/transactions/utils/money";
import {
  formatRecurringSchedule,
  recurringCreatedMessage,
  recurringDayOfMonth,
} from "./messages";
import type { RecurringIncome } from "./types";

const rule: RecurringIncome = {
  id: "r1",
  amount: 6500,
  categoryId: "cat-income-salary",
  period: "monthly",
  startDate: "2026-11-05",
  endDate: null,
  isActive: true,
  note: "Pensja",
  createdAt: "2026-11-05T08:00:00.000Z",
  generatedThrough: null,
};

describe("komunikaty wynagrodzenia cyklicznego", () => {
  it("pokazuje dzień miesiąca z daty pierwszego wpływu", () => {
    expect(recurringDayOfMonth(rule)).toBe(5);
    expect(formatRecurringSchedule(rule)).toBe("co miesiąc, 5. dnia");
  });

  it("toast po dodaniu zawiera kwotę, harmonogram i liczbę zaksięgowanych wpływów", () => {
    const text = recurringCreatedMessage(rule, 2);
    expect(text).toContain(formatPLN(6500));
    expect(text).toContain("co miesiąc, 5. dnia");
    expect(text).toContain("Zaksięgowano wpływy: 2");
  });

  it("bez zaksięgowanych wpływów nie dopisuje liczby", () => {
    expect(recurringCreatedMessage(rule, 0).includes("Zaksięgowano")).toBe(false);
  });

  it("savedTransactionMessage obsługuje zdarzenie recurring-created", () => {
    const text = savedTransactionMessage({ action: "recurring-created", recurringIncome: rule, booked: 1 });
    expect(text).toBe(recurringCreatedMessage(rule, 1));
  });
});
