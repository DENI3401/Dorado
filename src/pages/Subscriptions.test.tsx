// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import { formatPLN } from "@/features/transactions/utils/money";
import {
  makeSubscription,
  pinToday,
  resetStores,
  seedCategories,
  seedSubscriptions,
} from "@/test/subscriptionFixtures";
import Subscriptions from "./Subscriptions";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

/** Kwota tak, jak widać ją na ekranie (Intl wstawia twarde spacje). */
const pln = (amount: number) => formatPLN(amount).replace(/\s/g, " ");

// „Dziś” = 28.11.2026 (pinToday).
const rent = makeSubscription({ name: "Czynsz", amount: 1900, categoryId: "cat-expense-housing", startDate: "2026-08-31" });
const phone = makeSubscription({ name: "Abonament komórkowy", amount: 55, categoryId: "cat-expense-bills", startDate: "2026-09-12" });
const oc = makeSubscription({ name: "OC samochodu", amount: 1240, period: "yearly", categoryId: "c-insurance", startDate: "2025-12-15" });
const max = makeSubscription({ name: "Max", amount: 29.99, startDate: "2026-08-14", endDate: "2026-10-20" });
const disney = makeSubscription({ name: "Disney+", amount: 37.99, startDate: "2026-08-08", isActive: false });

beforeEach(() => {
  pinToday();
  resetStores();
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderPage() {
  const user = userEvent.setup();
  render(<Subscriptions />);
  return { user };
}

function seedTab() {
  seedCategories();
  seedSubscriptions([oc, max, phone, disney, rent]);
}

const section = (name: string) => screen.getByRole("region", { name });
const cardNames = (region: HTMLElement) =>
  within(region)
    .getAllByRole("listitem")
    .map((card) => within(card).getByRole("heading").textContent);
const card = (name: string) =>
  screen.getAllByRole("listitem").find((li) => within(li).queryByRole("heading", { name }) !== null)!;

describe("Subskrypcje — pusty stan", () => {
  it("zaprasza do dodania pierwszej subskrypcji i otwiera formularz", async () => {
    const { user } = renderPage();
    expect(screen.getByRole("heading", { name: "Nie masz jeszcze subskrypcji" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Podsumowanie subskrypcji" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Dodaj pierwszą subskrypcję" }));
    expect(await screen.findByRole("dialog", { name: "Nowa subskrypcja" })).toBeTruthy();
  });
});

describe("Subskrypcje — lista i podsumowanie", () => {
  it("sumy liczą tylko aktywne (roczna / 12), z przypisem o pominiętych", () => {
    seedTab();
    renderPage();
    const summary = within(section("Podsumowanie subskrypcji"));
    expect(summary.getByText(pln(2058.33))).toBeTruthy(); // 1900 + 55 + 1240 / 12
    expect(summary.getByText(pln(24700))).toBeTruthy(); // (1900 + 55) × 12 + 1240
    expect(summary.getByText("3")).toBeTruthy();
    expect(summary.getByText("Sumy obejmują tylko aktywne subskrypcje.")).toBeTruthy();
  });

  it("bez wstrzymanych i zakończonych nie ma przypisu", () => {
    seedCategories();
    seedSubscriptions([rent, phone]);
    renderPage();
    expect(screen.queryByText("Sumy obejmują tylko aktywne subskrypcje.")).toBeNull();
  });

  it("sekcje Aktywne / Zakończone / Wstrzymane; aktywne wg najbliższej płatności", () => {
    seedTab();
    renderPage();
    expect(cardNames(section("Aktywne (3)"))).toEqual(["Czynsz", "Abonament komórkowy", "OC samochodu"]);
    expect(cardNames(section("Zakończone (1)"))).toEqual(["Max"]);
    expect(cardNames(section("Wstrzymane (1)"))).toEqual(["Disney+"]);
  });

  it("karta pokazuje kategorię, koszt i najbliższą płatność", () => {
    seedTab();
    renderPage();
    const insurance = within(card("OC samochodu"));
    expect(insurance.getByText("Ubezpieczenia")).toBeTruthy();
    expect(insurance.getByText(`${pln(1240)} / rok`)).toBeTruthy();
    expect(insurance.getByText("15 gru 2026")).toBeTruthy();
    expect(insurance.getByText("(za 17 dni)")).toBeTruthy();

    // Płatność 31. dnia w listopadzie przypada 30.11.
    const housing = within(card("Czynsz"));
    expect(housing.getByText("Mieszkanie")).toBeTruthy();
    expect(housing.getByText("30 lis 2026")).toBeTruthy();
    expect(housing.getByText("(za 2 dni)")).toBeTruthy();
  });

  it("zakończona i wstrzymana: znacznik statusu, brak najbliższej płatności", () => {
    seedTab();
    renderPage();
    const ended = within(card("Max"));
    expect(ended.getByText("Zakończona")).toBeTruthy();
    expect(ended.getByText("Zakończona 20 paź 2026")).toBeTruthy();
    expect(ended.getByLabelText("brak")).toBeTruthy();
    // Zakończonej nie da się wstrzymać ani wznowić.
    expect(ended.queryByRole("button", { name: /Wstrzymaj|Wznów/ })).toBeNull();

    const paused = within(card("Disney+"));
    expect(paused.getByText("Wstrzymana")).toBeTruthy();
    expect(paused.getByRole("button", { name: "Wznów subskrypcję: Disney+" })).toBeTruthy();
  });

  it("subskrypcja w usuniętej kategorii: „Nieznana kategoria”", () => {
    seedSubscriptions([makeSubscription({ name: "Stara", categoryId: "nie-ma-takiej" })]);
    renderPage();
    expect(within(card("Stara")).getByText("Nieznana kategoria")).toBeTruthy();
  });
});

describe("Subskrypcje — akcje na karcie", () => {
  it("pauza przenosi kartę do Wstrzymanych i zmienia sumy, wznowienie przywraca", async () => {
    seedTab();
    const { user } = renderPage();

    await user.click(screen.getByRole("button", { name: "Wstrzymaj subskrypcję: Czynsz" }));
    expect(toast).toHaveBeenCalledWith("Wstrzymano subskrypcję „Czynsz”");
    expect(cardNames(section("Wstrzymane (2)"))).toEqual(["Czynsz", "Disney+"]);
    expect(within(section("Podsumowanie subskrypcji")).getByText(pln(158.33))).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Wznów subskrypcję: Czynsz" }));
    expect(toast).toHaveBeenCalledWith("Wznowiono subskrypcję „Czynsz”");
    expect(cardNames(section("Aktywne (3)"))).toContain("Czynsz");
  });

  it("usuwanie: potwierdzenie, toast z „Cofnij”, a cofnięcie przywraca subskrypcję", async () => {
    seedTab();
    const { user } = renderPage();

    await user.click(screen.getByRole("button", { name: "Usuń subskrypcję: Max" }));
    const confirm = await screen.findByRole("alertdialog", { name: "Usunąć subskrypcję?" });
    expect(within(confirm).getByText(/„Max”.*pozostaną w historii transakcji/)).toBeTruthy();
    await user.click(within(confirm).getByRole("button", { name: "Usuń" }));

    expect(useSubscriptionsStore.getState().subscriptions.some((s) => s.id === max.id)).toBe(false);
    expect(screen.queryByRole("region", { name: /Zakończone/ })).toBeNull();
    expect(toast).toHaveBeenCalledWith("Usunięto subskrypcję „Max”", {
      duration: 8000,
      action: { label: "Cofnij", onClick: expect.any(Function) },
    });

    const undo = toast.mock.calls.at(-1)![1].action.onClick as () => void;
    act(() => undo());
    expect(cardNames(section("Zakończone (1)"))).toEqual(["Max"]);
  });

  it("„Anuluj” w potwierdzeniu niczego nie usuwa", async () => {
    seedTab();
    const { user } = renderPage();
    await user.click(screen.getByRole("button", { name: "Usuń subskrypcję: Czynsz" }));
    const confirm = await screen.findByRole("alertdialog", { name: "Usunąć subskrypcję?" });
    await user.click(within(confirm).getByRole("button", { name: "Anuluj" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(5);
    expect(toast).not.toHaveBeenCalled();
  });

  it("„Edytuj” otwiera formularz z danymi i kategorią subskrypcji", async () => {
    seedTab();
    const { user } = renderPage();
    await user.click(screen.getByRole("button", { name: "Edytuj subskrypcję: OC samochodu" }));

    const dialog = await screen.findByRole("dialog", { name: "Edytuj subskrypcję" });
    expect((within(dialog).getByLabelText("Nazwa") as HTMLInputElement).value).toBe("OC samochodu");
    expect(within(dialog).getByRole("radio", { name: "Ubezpieczenia" }).getAttribute("aria-checked")).toBe("true");
    expect(within(dialog).getByRole("radio", { name: "Rocznie" }).getAttribute("aria-checked")).toBe("true");
  });
});

describe("Subskrypcje — dodawanie z kategorią (cały przepływ)", () => {
  it("nowa subskrypcja w kategorii „Mieszkanie” pojawia się na liście z tą kategorią", async () => {
    seedTab();
    const { user } = renderPage();
    await user.click(screen.getByRole("button", { name: "Dodaj subskrypcję" }));
    const dialog = await screen.findByRole("dialog", { name: "Nowa subskrypcja" });

    await user.type(within(dialog).getByLabelText("Nazwa"), "Miejsce w garażu");
    await user.type(within(dialog).getByLabelText("Kwota"), "250");
    await user.click(within(dialog).getByRole("radio", { name: "Mieszkanie" }));
    await user.click(within(dialog).getByRole("button", { name: "Dodaj subskrypcję" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(cardNames(section("Aktywne (4)"))[0]).toBe("Miejsce w garażu"); // płatność dziś
    const garage = within(card("Miejsce w garażu"));
    expect(garage.getByText("Mieszkanie")).toBeTruthy();
    expect(garage.getByText("(dzisiaj)")).toBeTruthy();
    expect(toast.success).toHaveBeenCalledWith(`Dodano subskrypcję „Miejsce w garażu” (${formatPLN(250)} / mies.)`);
  });
});
