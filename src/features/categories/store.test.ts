import { beforeEach, describe, expect, it } from "vitest";
import { useCategoriesStore, type CategoryValues } from "./store";

const values = (over: Partial<CategoryValues> = {}): CategoryValues => ({
  name: "Ubezpieczenia",
  type: "expense",
  icon: "ShieldCheck",
  color: "#22c55e",
  ...over,
});

beforeEach(() => {
  useCategoriesStore.setState({ customCategories: [] });
});

describe("useCategoriesStore — kategorie subskrypcji", () => {
  it("nowa kategoria z flagą jest kategorią subskrypcji (własna, nie domyślna)", () => {
    const c = useCategoriesStore.getState().addCategory(values({ forSubscriptions: true }));
    expect(c).toMatchObject({ name: "Ubezpieczenia", type: "expense", isDefault: false, forSubscriptions: true });
    expect(useCategoriesStore.getState().customCategories).toEqual([c]);
  });

  it("bez flagi (albo z false) pole nie trafia do danych — jak w starszych danych i kopiach", () => {
    const { addCategory } = useCategoriesStore.getState();
    expect("forSubscriptions" in addCategory(values())).toBe(false);
    expect("forSubscriptions" in addCategory(values({ name: "Inna", forSubscriptions: false }))).toBe(false);
  });

  it("kategoria przychodów nie może być kategorią subskrypcji", () => {
    const c = useCategoriesStore
      .getState()
      .addCategory(values({ name: "Korepetycje", type: "income", forSubscriptions: true }));
    expect(c.forSubscriptions).toBeUndefined();
  });

  it("edycja włącza i wyłącza flagę, zachowując id", () => {
    const { addCategory, updateCategory } = useCategoriesStore.getState();
    const c = addCategory(values({ name: "Kawiarnie", icon: "Coffee" }));

    const on = updateCategory(c.id, values({ name: "Kawiarnie", icon: "Coffee", forSubscriptions: true }));
    expect(on).toMatchObject({ id: c.id, forSubscriptions: true });

    const off = updateCategory(c.id, values({ name: "Kawiarnie", icon: "Coffee", forSubscriptions: false }));
    expect(off?.id).toBe(c.id);
    expect(off && "forSubscriptions" in off).toBe(false);
    expect(useCategoriesStore.getState().customCategories).toEqual([off]);
  });

  it("edycja bez pola forSubscriptions zostawia flagę bez zmian", () => {
    const { addCategory, updateCategory } = useCategoriesStore.getState();
    const c = addCategory(values({ forSubscriptions: true }));
    const renamed = updateCategory(c.id, values({ name: "Polisy" }));
    expect(renamed).toMatchObject({ name: "Polisy", forSubscriptions: true });
  });

  it("zmiana typu na przychód zdejmuje flagę", () => {
    const { addCategory, updateCategory } = useCategoriesStore.getState();
    const c = addCategory(values({ forSubscriptions: true }));
    expect(updateCategory(c.id, values({ type: "income" }))?.forSubscriptions).toBeUndefined();
  });

  it("operacje na nieistniejącym id zwracają null", () => {
    const { updateCategory, removeCategory } = useCategoriesStore.getState();
    expect(updateCategory("nope", values())).toBeNull();
    expect(removeCategory("nope")).toBeNull();
  });
});
