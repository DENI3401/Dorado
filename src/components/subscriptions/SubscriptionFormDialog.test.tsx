// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCategoriesStore } from "@/features/categories/store";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import type { Subscription } from "@/features/subscriptions/types";
import {
  makeSubscription,
  pinToday,
  resetStores,
  seedCategories,
  seedSubscriptions,
} from "@/test/subscriptionFixtures";
import { SubscriptionFormDialog } from "./SubscriptionFormDialog";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

beforeEach(() => {
  pinToday();
  resetStores();
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function openForm(subscription?: Subscription) {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  render(<SubscriptionFormDialog open onOpenChange={onOpenChange} subscription={subscription} />);
  const dialog = await screen.findByRole("dialog", {
    name: subscription ? "Edytuj subskrypcję" : "Nowa subskrypcja",
  });
  const categories = within(dialog).getByRole("radiogroup", { name: "Kategoria" });
  return { user, onOpenChange, dialog, categories };
}

const optionNames = (group: HTMLElement) =>
  within(group)
    .getAllByRole("radio")
    .map((radio) => radio.textContent);

const checkedName = (group: HTMLElement) =>
  within(group)
    .getAllByRole("radio")
    .filter((radio) => radio.getAttribute("aria-checked") === "true")
    .map((radio) => radio.textContent);

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, name: string, amount: string) {
  await user.type(within(dialog).getByLabelText("Nazwa"), name);
  await user.type(within(dialog).getByLabelText("Kwota"), amount);
  await user.click(within(dialog).getByRole("button", { name: "Dodaj subskrypcję" }));
}

describe("SubscriptionFormDialog — pole „Kategoria”", () => {
  it("domyślnie zaznacza „Subskrypcje” i pokazuje tylko kategorie płatności cyklicznych", async () => {
    const { categories, dialog } = await openForm();
    expect(optionNames(categories)).toEqual([
      "Subskrypcje",
      "Transport",
      "Mieszkanie",
      "Rachunki",
      "Zdrowie",
      "Inne wydatki",
    ]);
    expect(checkedName(categories)).toEqual(["Subskrypcje"]);
    expect(within(dialog).getByText("Płatności tej subskrypcji trafią do Transakcji w tej kategorii.")).toBeTruthy();
  });

  it("dokłada własne kategorie subskrypcji i kategorie, w których są już subskrypcje — bez jednorazowych", async () => {
    seedCategories();
    seedSubscriptions([makeSubscription({ name: "Karnet na siłownię", categoryId: "c-sport" })]);
    const { categories } = await openForm();
    expect(optionNames(categories)).toEqual([
      "Subskrypcje",
      "Transport",
      "Mieszkanie",
      "Rachunki",
      "Zdrowie",
      "Ubezpieczenia",
      "Sport",
      "Inne wydatki",
    ]);
    for (const oneOff of ["Jedzenie", "Zakupy", "Rozrywka", "Kawiarnie"]) {
      expect(within(categories).queryByRole("radio", { name: oneOff })).toBeNull();
    }
  });

  it("zapisuje subskrypcję z wybraną kategorią i zamyka okno z toastem", async () => {
    const { user, dialog, categories, onOpenChange } = await openForm();
    await user.click(within(categories).getByRole("radio", { name: "Rachunki" }));
    expect(checkedName(categories)).toEqual(["Rachunki"]);

    await fillAndSubmit(user, dialog, "Internet światłowodowy", "69,99");

    const [saved] = useSubscriptionsStore.getState().subscriptions;
    expect(saved).toMatchObject({
      name: "Internet światłowodowy",
      amount: 69.99,
      categoryId: "cat-expense-bills",
      period: "monthly",
      startDate: "2026-11-28",
      endDate: null,
    });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Dodano subskrypcję „Internet światłowodowy”"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("ponowne kliknięcie wybranej kategorii nie zdejmuje wyboru (kategoria jest wymagana)", async () => {
    const { user, categories } = await openForm();
    await user.click(within(categories).getByRole("radio", { name: "Subskrypcje" }));
    expect(checkedName(categories)).toEqual(["Subskrypcje"]);
  });
});

describe("SubscriptionFormDialog — nowa kategoria z formularza", () => {
  it("tworzy kategorię subskrypcji, zaznacza ją i nie wysyła przy tym formularza subskrypcji", async () => {
    const { user, dialog, categories } = await openForm();
    await user.click(within(dialog).getByRole("button", { name: "Nowa kategoria" }));
    const nested = await screen.findByRole("dialog", { name: "Nowa kategoria subskrypcji" });

    // Z formularza subskrypcji powstaje zawsze wydatek — bez wyboru typu i bez pola „Dostępna w subskrypcjach”.
    expect(within(nested).queryByRole("radiogroup", { name: "Typ kategorii" })).toBeNull();
    expect(within(nested).queryByLabelText("Dostępna w subskrypcjach")).toBeNull();

    await user.click(within(nested).getByRole("radio", { name: "ShieldCheck" }));
    // Enter w polu nazwy zatwierdza tylko okno kategorii.
    await user.type(within(nested).getByLabelText("Nazwa"), "Ubezpieczenia{Enter}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Nowa kategoria subskrypcji" })).toBeNull(),
    );
    const [created] = useCategoriesStore.getState().customCategories;
    expect(created).toMatchObject({
      name: "Ubezpieczenia",
      type: "expense",
      icon: "ShieldCheck",
      isDefault: false,
      forSubscriptions: true,
    });
    expect(toast.success).toHaveBeenCalledWith("Dodano kategorię „Ubezpieczenia”");
    expect(checkedName(categories)).toEqual(["Ubezpieczenia"]);
    expect(optionNames(categories).at(-2)).toBe("Ubezpieczenia");

    // Formularz subskrypcji dalej otwarty, bez błędów i bez zapisu.
    expect(useSubscriptionsStore.getState().subscriptions).toEqual([]);
    expect(within(dialog).queryAllByRole("alert")).toEqual([]);

    // Schemat zna już nową kategorię — zapis przechodzi.
    await fillAndSubmit(user, dialog, "OC samochodu", "1240");
    expect(useSubscriptionsStore.getState().subscriptions[0]).toMatchObject({
      name: "OC samochodu",
      categoryId: created.id,
    });
  });

  it("„Anuluj” w oknie kategorii niczego nie tworzy i zostawia wybór", async () => {
    const { user, dialog, categories } = await openForm();
    await user.click(within(dialog).getByRole("button", { name: "Nowa kategoria" }));
    const nested = await screen.findByRole("dialog", { name: "Nowa kategoria subskrypcji" });
    await user.type(within(nested).getByLabelText("Nazwa"), "Ubezpieczenia");
    await user.click(within(nested).getByRole("button", { name: "Anuluj" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Nowa kategoria subskrypcji" })).toBeNull(),
    );
    expect(useCategoriesStore.getState().customCategories).toEqual([]);
    expect(checkedName(categories)).toEqual(["Subskrypcje"]);
    expect(screen.getByRole("dialog", { name: "Nowa subskrypcja" })).toBeTruthy();
  });

  it("nazwa istniejącej kategorii wydatków: błąd w oknie kategorii, nic nie powstaje", async () => {
    const { user, dialog } = await openForm();
    await user.click(within(dialog).getByRole("button", { name: "Nowa kategoria" }));
    const nested = await screen.findByRole("dialog", { name: "Nowa kategoria subskrypcji" });
    await user.type(within(nested).getByLabelText("Nazwa"), "rachunki");
    await user.click(within(nested).getByRole("button", { name: "Dodaj kategorię" }));

    expect((await within(nested).findByRole("alert")).textContent).toBe(
      "Kategoria o takiej nazwie już istnieje",
    );
    expect(useCategoriesStore.getState().customCategories).toEqual([]);
  });
});

describe("SubscriptionFormDialog — edycja", () => {
  it("zaznacza kategorię subskrypcji i zapisuje jej zmianę", async () => {
    seedCategories();
    const gym = makeSubscription({ name: "Karnet na siłownię", amount: 139, categoryId: "c-sport", startDate: "2026-09-01" });
    seedSubscriptions([gym]);
    const { user, dialog, categories, onOpenChange } = await openForm(gym);

    expect(checkedName(categories)).toEqual(["Sport"]);
    expect((within(dialog).getByLabelText("Nazwa") as HTMLInputElement).value).toBe("Karnet na siłownię");

    await user.click(within(categories).getByRole("radio", { name: "Zdrowie" }));
    await user.click(within(dialog).getByRole("button", { name: "Zapisz zmiany" }));

    expect(useSubscriptionsStore.getState().subscriptions[0]).toMatchObject({
      id: gym.id,
      categoryId: "cat-expense-health",
      createdAt: gym.createdAt,
    });
    expect(toast.success).toHaveBeenCalledWith("Zapisano zmiany w subskrypcji „Karnet na siłownię”");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("kategoria spoza listy (np. „Jedzenie” z kopii zapasowej) jest widoczna i zapis bez zmian działa", async () => {
    const catering = makeSubscription({ name: "Catering dietetyczny", amount: 1290, categoryId: "cat-expense-food" });
    seedSubscriptions([catering]);
    const { user, dialog, categories } = await openForm(catering);

    expect(checkedName(categories)).toEqual(["Jedzenie"]);
    await user.click(within(dialog).getByRole("button", { name: "Zapisz zmiany" }));

    expect(within(dialog).queryAllByRole("alert")).toEqual([]);
    expect(useSubscriptionsStore.getState().subscriptions[0]).toEqual(catering);
  });
});

describe("SubscriptionFormDialog — walidacja", () => {
  it("bez nazwy i kwoty pokazuje błędy i niczego nie zapisuje", async () => {
    const { user, dialog, onOpenChange } = await openForm();
    await user.click(within(dialog).getByRole("button", { name: "Dodaj subskrypcję" }));

    const alerts = await within(dialog).findAllByRole("alert");
    expect(alerts.map((a) => a.textContent)).toEqual(["Podaj nazwę", "Podaj kwotę"]);
    expect(within(dialog).getByLabelText("Nazwa").getAttribute("aria-invalid")).toBe("true");
    expect(useSubscriptionsStore.getState().subscriptions).toEqual([]);
    expect(toast.success).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("odrzuca koniec wcześniejszy niż pierwsza płatność", async () => {
    const { user, dialog } = await openForm();
    await user.type(within(dialog).getByLabelText("Nazwa"), "Siłownia");
    await user.type(within(dialog).getByLabelText("Kwota"), "139");
    await user.type(within(dialog).getByLabelText("Koniec (opcjonalnie)"), "2026-11-01");
    await user.click(within(dialog).getByRole("button", { name: "Dodaj subskrypcję" }));

    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia",
    );
    expect(useSubscriptionsStore.getState().subscriptions).toEqual([]);
  });
});
