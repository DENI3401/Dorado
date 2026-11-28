import { describe, expect, it } from "vitest";
import { formatPLN } from "@/features/transactions/utils/money";
import {
  BILLING_PERIOD_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  confirmRemoveSubscriptionText,
  formatSubscriptionCost,
  pausedSubscriptionMessage,
  removedSubscriptionMessage,
  resumedSubscriptionMessage,
  savedSubscriptionMessage,
} from "./messages";
import type { Subscription } from "./types";

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: "s1",
  name: "Netflix",
  amount: 49.99,
  categoryId: "cat-expense-subscriptions",
  period: "monthly",
  startDate: "2026-03-15",
  endDate: null,
  isActive: true,
  note: "",
  createdAt: "2026-03-01T00:00:00.000Z",
  ...over,
});

/** Intl wstawia twardą spację przed „zł” — do porównań z tekstem widocznym w UI. */
const visible = (text: string) => text.replace(/\s/g, " ");

describe("etykiety", () => {
  it("okres płatności i status po polsku", () => {
    expect(BILLING_PERIOD_LABELS).toEqual({ monthly: "Miesięcznie", yearly: "Rocznie" });
    expect(SUBSCRIPTION_STATUS_LABELS).toEqual({
      active: "Aktywna",
      paused: "Wstrzymana",
      ended: "Zakończona",
    });
  });
});

describe("formatSubscriptionCost", () => {
  it("kwota z groszami i okres", () => {
    expect(formatSubscriptionCost(sub())).toBe(`${formatPLN(49.99)} / mies.`);
    expect(visible(formatSubscriptionCost(sub()))).toBe("49,99 zł / mies.");
  });

  it("subskrypcja roczna", () => {
    expect(visible(formatSubscriptionCost(sub({ period: "yearly", amount: 389 })))).toBe(
      "389,00 zł / rok",
    );
  });
});

describe("komunikaty toastów i dialogów", () => {
  it("po dodaniu: nazwa i koszt", () => {
    const s = sub({ name: "OC samochodu", amount: 1240, period: "yearly" });
    expect(savedSubscriptionMessage({ action: "created", subscription: s })).toBe(
      `Dodano subskrypcję „OC samochodu” (${formatPLN(1240)} / rok)`,
    );
  });

  it("po edycji", () => {
    expect(savedSubscriptionMessage({ action: "updated", subscription: sub() })).toBe(
      "Zapisano zmiany w subskrypcji „Netflix”",
    );
  });

  it("usunięcie: toast i pytanie w modalu (historia transakcji zostaje)", () => {
    expect(removedSubscriptionMessage(sub())).toBe("Usunięto subskrypcję „Netflix”");
    const text = confirmRemoveSubscriptionText(sub());
    expect(text).toContain("„Netflix”");
    expect(text).toContain("pozostaną w historii transakcji");
  });

  it("pauza i wznowienie", () => {
    expect(pausedSubscriptionMessage(sub())).toBe("Wstrzymano subskrypcję „Netflix”");
    expect(resumedSubscriptionMessage(sub())).toBe("Wznowiono subskrypcję „Netflix”");
  });
});
