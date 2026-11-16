import { describe, expect, it } from "vitest";
import type { Subscription } from "@/features/subscriptions/types";
import type { Transaction } from "@/features/transactions/types";
import { planSubscriptionPayments } from "./planSubscriptionPayments";

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "s1",
    name: "Netflix",
    amount: 49.99,
    categoryId: "cat-subscriptions",
    period: "monthly",
    startDate: "2026-09-15",
    endDate: null,
    isActive: true,
    note: "",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function tx(subscriptionId: string, date: string): Transaction {
  return {
    id: `t-${date}`,
    type: "expense",
    incomeKind: null,
    amount: 49.99,
    categoryId: "cat-subscriptions",
    date,
    note: "Netflix",
    createdAt: "2026-09-01T00:00:00.000Z",
    subscriptionId,
  };
}

describe("planSubscriptionPayments", () => {
  it("przy pierwszym uruchomieniu dopisuje płatności od startDate do dziś (włącznie)", () => {
    const plan = planSubscriptionPayments([sub()], [], {}, "2026-11-15");
    expect(plan.created.map((t) => t.date)).toEqual(["2026-09-15", "2026-10-15", "2026-11-15"]);
    expect(plan.created[0]).toMatchObject({
      type: "expense",
      amount: 49.99,
      note: "Netflix",
      subscriptionId: "s1",
      incomeKind: null,
    });
    expect(plan.syncedThrough).toEqual({ s1: "2026-11-15" });
  });

  it("nie tworzy płatności z przyszłości", () => {
    const plan = planSubscriptionPayments([sub({ startDate: "2026-12-01" })], [], {}, "2026-11-15");
    expect(plan.created).toEqual([]);
  });

  it("kolejne uruchomienie tego samego dnia niczego nie dodaje", () => {
    const first = planSubscriptionPayments([sub()], [], {}, "2026-11-15");
    const second = planSubscriptionPayments([sub()], first.created, first.syncedThrough, "2026-11-15");
    expect(second.created).toEqual([]);
  });

  it("ręcznie usunięta transakcja nie wraca", () => {
    const first = planSubscriptionPayments([sub()], [], {}, "2026-11-15");
    const afterDelete = first.created.filter((t) => t.date !== "2026-10-15");
    const second = planSubscriptionPayments([sub()], afterDelete, first.syncedThrough, "2026-11-16");
    expect(second.created).toEqual([]);
  });

  it("dopisuje tylko nowe terminy po upływie czasu", () => {
    const first = planSubscriptionPayments([sub()], [], {}, "2026-11-15");
    const later = planSubscriptionPayments([sub()], first.created, first.syncedThrough, "2026-12-20");
    expect(later.created.map((t) => t.date)).toEqual(["2026-12-15"]);
    expect(later.syncedThrough).toEqual({ s1: "2026-12-20" });
  });

  it("nie duplikuje płatności, która już jest w historii", () => {
    const plan = planSubscriptionPayments([sub()], [tx("s1", "2026-10-15")], {}, "2026-11-15");
    expect(plan.created.map((t) => t.date)).toEqual(["2026-09-15", "2026-11-15"]);
  });

  it("wstrzymana subskrypcja nic nie tworzy, ale po wznowieniu nie ma wstecznych płatności", () => {
    const first = planSubscriptionPayments([sub()], [], {}, "2026-09-20");
    const paused = planSubscriptionPayments(
      [sub({ isActive: false })],
      first.created,
      first.syncedThrough,
      "2026-11-20",
    );
    expect(paused.created).toEqual([]);
    expect(paused.syncedThrough).toEqual({ s1: "2026-11-20" });

    const resumed = planSubscriptionPayments([sub()], first.created, paused.syncedThrough, "2026-11-21");
    expect(resumed.created).toEqual([]);
    const nextMonth = planSubscriptionPayments([sub()], first.created, resumed.syncedThrough, "2026-12-15");
    expect(nextMonth.created.map((t) => t.date)).toEqual(["2026-12-15"]);
  });

  it("subskrypcja z 31. dniem płaci w ostatni dzień krótkiego miesiąca", () => {
    const plan = planSubscriptionPayments(
      [sub({ startDate: "2026-01-31" })],
      [],
      {},
      "2027-02-28",
    );
    const dates = plan.created.map((t) => t.date);
    expect(dates).toContain("2026-02-28");
    expect(dates).toContain("2026-04-30");
    expect(dates).toContain("2027-02-28");
  });

  it("respektuje endDate", () => {
    const plan = planSubscriptionPayments([sub({ endDate: "2026-10-15" })], [], {}, "2026-12-31");
    expect(plan.created.map((t) => t.date)).toEqual(["2026-09-15", "2026-10-15"]);
  });
});
