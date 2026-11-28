import { beforeEach, describe, expect, it } from "vitest";
import { useCategoriesStore } from "@/features/categories/store";
import { FALLBACK_CATEGORY_ID } from "@/features/categories/defaultCategories";
import { deleteCategory } from "@/features/transactions/actions";
import { useTransactionsStore } from "@/features/transactions/store";
import type { SubscriptionFormValues } from "./schema";
import { useSubscriptionsStore } from "./store";

const values = (over: Partial<SubscriptionFormValues> = {}): SubscriptionFormValues => ({
  name: "Netflix",
  amount: 49.99,
  categoryId: "cat-expense-subscriptions",
  period: "monthly",
  startDate: "2026-03-15",
  endDate: "",
  note: "",
  ...over,
});

beforeEach(() => {
  useSubscriptionsStore.setState({ subscriptions: [] });
  useTransactionsStore.setState({ transactions: [] });
  useCategoriesStore.setState({ customCategories: [] });
});

describe("useSubscriptionsStore", () => {
  it("dodaje subskrypcję jako aktywną, a pusty endDate zamienia na null", () => {
    const s = useSubscriptionsStore.getState().addSubscription(values());
    expect(s.isActive).toBe(true);
    expect(s.endDate).toBeNull();
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(1);
  });

  it("zapisuje endDate, gdy jest podany", () => {
    const s = useSubscriptionsStore.getState().addSubscription(values({ endDate: "2026-12-31" }));
    expect(s.endDate).toBe("2026-12-31");
  });

  it("edycja zmienia pola, ale zachowuje id, createdAt i pauzę", () => {
    const { addSubscription, setActive, updateSubscription } = useSubscriptionsStore.getState();
    const s = addSubscription(values());
    setActive(s.id, false);
    const updated = updateSubscription(s.id, values({ name: "HBO", amount: 29 }));
    expect(updated?.name).toBe("HBO");
    expect(updated?.amount).toBe(29);
    expect(updated?.id).toBe(s.id);
    expect(updated?.createdAt).toBe(s.createdAt);
    expect(updated?.isActive).toBe(false);
  });

  it("usuwa i przywraca (Undo) bez duplikatu", () => {
    const { addSubscription, removeSubscription, restoreSubscription } =
      useSubscriptionsStore.getState();
    const s = addSubscription(values());
    const removed = removeSubscription(s.id)!;
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(0);
    restoreSubscription(removed);
    restoreSubscription(removed);
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(1);
  });

  it("setActive przełącza pauzę i wznowienie", () => {
    const { addSubscription, setActive } = useSubscriptionsStore.getState();
    const s = addSubscription(values());
    expect(setActive(s.id, false)?.isActive).toBe(false);
    expect(setActive(s.id, true)?.isActive).toBe(true);
  });

  it("operacje na nieistniejącym id zwracają null", () => {
    const st = useSubscriptionsStore.getState();
    expect(st.updateSubscription("nope", values())).toBeNull();
    expect(st.removeSubscription("nope")).toBeNull();
    expect(st.setActive("nope", false)).toBeNull();
  });

  it("usunięcie subskrypcji nie rusza wygenerowanych transakcji", () => {
    const s = useSubscriptionsStore.getState().addSubscription(values());
    const t = useTransactionsStore.getState().addTransaction({
      type: "expense", amount: 49.99, categoryId: s.categoryId, date: "2026-03-15", note: "",
    });
    useSubscriptionsStore.getState().removeSubscription(s.id);
    expect(useTransactionsStore.getState().transactions.map((x) => x.id)).toEqual([t.id]);
  });
});

describe("kategoria subskrypcji w magazynie", () => {
  it("nowa subskrypcja trafia na początek listy z wybraną kategorią", () => {
    const { addSubscription } = useSubscriptionsStore.getState();
    const first = addSubscription(values());
    const second = addSubscription(values({ name: "OC samochodu", categoryId: "c-insurance" }));
    expect(second.categoryId).toBe("c-insurance");
    expect(useSubscriptionsStore.getState().subscriptions.map((s) => s.id)).toEqual([second.id, first.id]);
  });

  it("edycja zmienia kategorię", () => {
    const { addSubscription, updateSubscription } = useSubscriptionsStore.getState();
    const s = addSubscription(values());
    expect(updateSubscription(s.id, values({ categoryId: "cat-expense-bills" }))?.categoryId).toBe(
      "cat-expense-bills",
    );
  });

  it("reassignCategory przepina tylko subskrypcje z danej kategorii i zwraca ich liczbę", () => {
    const { addSubscription, reassignCategory } = useSubscriptionsStore.getState();
    const a = addSubscription(values({ categoryId: "c-old" }));
    const b = addSubscription(values({ categoryId: "c-old" }));
    const c = addSubscription(values({ categoryId: "cat-expense-bills" }));
    expect(reassignCategory("c-old", "cat-expense-other")).toBe(2);
    const byId = new Map(useSubscriptionsStore.getState().subscriptions.map((s) => [s.id, s.categoryId]));
    expect(byId.get(a.id)).toBe("cat-expense-other");
    expect(byId.get(b.id)).toBe("cat-expense-other");
    expect(byId.get(c.id)).toBe("cat-expense-bills");
    expect(reassignCategory("c-old", "cat-expense-other")).toBe(0);
  });
});

describe("deleteCategory a subskrypcje", () => {
  it("przepina subskrypcje usuwanej kategorii na „Inne wydatki”", () => {
    const cat = useCategoriesStore.getState().addCategory({
      name: "Streaming", type: "expense", icon: "Clapperboard", color: "#a855f7",
    });
    const s = useSubscriptionsStore.getState().addSubscription(values({ categoryId: cat.id }));
    const r = deleteCategory(cat.id);
    expect(r.ok && r.reassignedSubscriptions).toBe(1);
    const after = useSubscriptionsStore.getState().subscriptions.find((x) => x.id === s.id);
    expect(after?.categoryId).toBe(FALLBACK_CATEGORY_ID.expense);
  });

  it("usunięcie własnej kategorii subskrypcji: subskrypcje i ich płatności idą do „Inne wydatki”", () => {
    const cat = useCategoriesStore.getState().addCategory({
      name: "Ubezpieczenia", type: "expense", icon: "ShieldCheck", color: "#22c55e", forSubscriptions: true,
    });
    const s = useSubscriptionsStore.getState().addSubscription(values({ categoryId: cat.id }));
    useTransactionsStore.getState().addTransaction({
      type: "expense", amount: 49.99, categoryId: cat.id, date: "2026-03-15", note: "OC",
    });
    const r = deleteCategory(cat.id);
    expect(r.ok && [r.reassigned, r.reassignedSubscriptions]).toEqual([1, 1]);
    expect(useSubscriptionsStore.getState().subscriptions.find((x) => x.id === s.id)?.categoryId).toBe(
      FALLBACK_CATEGORY_ID.expense,
    );
    expect(useTransactionsStore.getState().transactions[0].categoryId).toBe(FALLBACK_CATEGORY_ID.expense);
    expect(useCategoriesStore.getState().customCategories).toEqual([]);
  });
});
