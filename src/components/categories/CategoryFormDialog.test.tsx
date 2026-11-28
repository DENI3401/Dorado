// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCategoriesStore } from "@/features/categories/store";
import type { Category } from "@/features/categories/types";
import { makeCategory, resetStores, seedCategories } from "@/test/subscriptionFixtures";
import { CategoryFormDialog } from "./CategoryFormDialog";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

beforeEach(() => {
  resetStores();
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

/** Okno kategorii tak, jak otwiera je Transakcje → Kategorie (bez trybu subskrypcji). */
async function openEditor(category?: Category) {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  render(<CategoryFormDialog open onOpenChange={onOpenChange} category={category} onSaved={onSaved} />);
  const dialog = await screen.findByRole("dialog", { name: category ? "Edytuj kategorię" : "Nowa kategoria" });
  return { user, dialog, onOpenChange, onSaved };
}

const subscriptionsCheckbox = (dialog: HTMLElement) =>
  within(dialog).queryByLabelText<HTMLInputElement>("Dostępna w subskrypcjach");

describe("CategoryFormDialog (Transakcje → Kategorie) — „Dostępna w subskrypcjach”", () => {
  it("pole jest tylko dla kategorii wydatków i domyślnie odznaczone", async () => {
    const { user, dialog } = await openEditor();
    expect(subscriptionsCheckbox(dialog)?.checked).toBe(false);

    await user.click(within(dialog).getByRole("radio", { name: "Przychód" }));
    expect(subscriptionsCheckbox(dialog)).toBeNull();
  });

  it("zaznaczone: nowa kategoria wydatków jest dostępna w subskrypcjach", async () => {
    const { user, dialog, onSaved, onOpenChange } = await openEditor();
    await user.type(within(dialog).getByLabelText("Nazwa"), "Siłownia");
    await user.click(subscriptionsCheckbox(dialog)!);
    await user.click(within(dialog).getByRole("button", { name: "Dodaj kategorię" }));

    const [created] = useCategoriesStore.getState().customCategories;
    expect(created).toMatchObject({ name: "Siłownia", type: "expense", forSubscriptions: true });
    expect(onSaved).toHaveBeenCalledWith({ action: "created", category: created });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith("Dodano kategorię „Siłownia”");
  });

  it("odznaczone: zwykła kategoria wydatków (bez flagi)", async () => {
    const { user, dialog } = await openEditor();
    await user.type(within(dialog).getByLabelText("Nazwa"), "Kawiarnie");
    await user.click(within(dialog).getByRole("button", { name: "Dodaj kategorię" }));
    expect("forSubscriptions" in useCategoriesStore.getState().customCategories[0]).toBe(false);
  });

  it("zaznaczone, a potem zmiana typu na przychód — kategoria przychodów nie dostaje flagi", async () => {
    const { user, dialog } = await openEditor();
    await user.type(within(dialog).getByLabelText("Nazwa"), "Najem");
    await user.click(subscriptionsCheckbox(dialog)!);
    await user.click(within(dialog).getByRole("radio", { name: "Przychód" }));
    await user.click(within(dialog).getByRole("button", { name: "Dodaj kategorię" }));

    const [created] = useCategoriesStore.getState().customCategories;
    expect(created.type).toBe("income");
    expect(created.forSubscriptions).toBeUndefined();
  });

  it("edycja: pole pokazuje zapisaną flagę i pozwala ją wyłączyć", async () => {
    const insurance = makeCategory({ id: "c-ins", name: "Ubezpieczenia", icon: "ShieldCheck", forSubscriptions: true });
    seedCategories([insurance]);
    const { user, dialog } = await openEditor(insurance);

    expect(subscriptionsCheckbox(dialog)?.checked).toBe(true);
    await user.click(subscriptionsCheckbox(dialog)!);
    await user.click(within(dialog).getByRole("button", { name: "Zapisz kategorię" }));

    const [updated] = useCategoriesStore.getState().customCategories;
    expect(updated.id).toBe("c-ins");
    expect(updated.forSubscriptions).toBeUndefined();
  });

  it("edycja zwykłej kategorii: można ją włączyć dla subskrypcji", async () => {
    const sport = makeCategory({ id: "c-sport", name: "Sport", icon: "Dumbbell" });
    seedCategories([sport]);
    const { user, dialog } = await openEditor(sport);

    expect(subscriptionsCheckbox(dialog)?.checked).toBe(false);
    await user.click(subscriptionsCheckbox(dialog)!);
    await user.click(within(dialog).getByRole("button", { name: "Zapisz kategorię" }));
    expect(useCategoriesStore.getState().customCategories[0]).toMatchObject({ id: "c-sport", forSubscriptions: true });
  });
});

describe("CategoryFormDialog — tryb subskrypcji (z formularza subskrypcji)", () => {
  it("tytuł i opis dla stałych opłat, bez wyboru typu i bez pola flagi", async () => {
    render(<CategoryFormDialog open onOpenChange={vi.fn()} forSubscriptions />);
    const dialog = await screen.findByRole("dialog", { name: "Nowa kategoria subskrypcji" });
    expect(within(dialog).getByText(/np\. ubezpieczenia czy abonament medyczny/)).toBeTruthy();
    expect(within(dialog).queryByRole("radiogroup", { name: "Typ kategorii" })).toBeNull();
    expect(subscriptionsCheckbox(dialog)).toBeNull();
  });
});
