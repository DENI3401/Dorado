import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useSettingsStore } from "@/features/settings";
import { useTransactionsStore } from "@/features/transactions/store";
import type { Transaction } from "@/features/transactions/types";
import { checkLowBalance } from "./check";
import { lowBalanceMessage } from "./messages";
import { useAlertStore } from "./store";

vi.mock("sonner", () => ({ toast: { warning: vi.fn() } }));

const warning = vi.mocked(toast.warning);

let seq = 0;
const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: `t${++seq}`,
  type: "expense",
  incomeKind: null,
  amount: 10,
  categoryId: "cat-expense-food",
  date: "2026-11-05",
  note: "",
  createdAt: "2026-11-05T10:00:00.000Z",
  ...over,
});
const income = (over: Partial<Transaction> = {}): Transaction =>
  tx({ type: "income", incomeKind: "salary", categoryId: "cat-income-salary", ...over });

const TODAY = "2026-11-20";

/** Przychód 1000 i wydatek 700 w listopadzie → saldo 300, wydano 700. Próg domyślny 500. */
function seedLowBalance() {
  useTransactionsStore.setState({
    transactions: [income({ amount: 1000, date: "2026-11-02" }), tx({ amount: 700, date: "2026-11-03" })],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useTransactionsStore.setState({ transactions: [] });
  useSettingsStore.getState().resetSettings();
  useAlertStore.setState({ lowBalanceAlertTriggered: false, alertCycleStart: null });
});

describe("checkLowBalance", () => {
  it("saldo powyżej progu → brak alertu", () => {
    useTransactionsStore.setState({ transactions: [income({ amount: 5000, date: "2026-11-02" })] });
    expect(checkLowBalance({ today: TODAY })).toBe(false);
    expect(warning).not.toHaveBeenCalled();
    expect(useAlertStore.getState().lowBalanceAlertTriggered).toBe(false);
  });

  it("pierwsze wywołanie pokazuje toast i ustawia flagę, drugie nie", () => {
    seedLowBalance();

    expect(checkLowBalance({ today: TODAY })).toBe(true);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(lowBalanceMessage(700, 300), {
      id: "low-balance",
      duration: 10_000,
    });
    expect(useAlertStore.getState().lowBalanceAlertTriggered).toBe(true);
    expect(useAlertStore.getState().alertCycleStart).toBe("2026-11-01");

    expect(checkLowBalance({ today: TODAY })).toBe(false);
    expect(warning).toHaveBeenCalledTimes(1);
  });

  it("po resetLowBalanceFlag znów pokazuje alert", () => {
    seedLowBalance();
    checkLowBalance({ today: TODAY });
    useAlertStore.getState().resetLowBalanceFlag();

    expect(checkLowBalance({ today: TODAY })).toBe(true);
    expect(warning).toHaveBeenCalledTimes(2);
  });

  it("nowy cykl → alert znów może zadziałać (saldo z rollover nadal poniżej progu)", () => {
    seedLowBalance();
    checkLowBalance({ today: TODAY });

    expect(checkLowBalance({ today: "2026-12-05" })).toBe(true);
    expect(warning).toHaveBeenCalledTimes(2);
    expect(warning).toHaveBeenLastCalledWith(lowBalanceMessage(0, 300), {
      id: "low-balance",
      duration: 10_000,
    });
    expect(useAlertStore.getState().alertCycleStart).toBe("2026-12-01");
  });

  it("zmiana dnia cyklu zmienia początek cyklu i ponownie ocenia alert", () => {
    seedLowBalance();
    checkLowBalance({ today: TODAY });

    useSettingsStore.getState().updateSettings({ cycleStartDay: 15 });
    // cykl od 15.11 — saldo otwarcia 300 z początku listopada, wydatki sprzed 15. trafiają do rollover
    expect(checkLowBalance({ today: TODAY })).toBe(true);
    expect(useAlertStore.getState().alertCycleStart).toBe("2026-11-15");
  });

  it("force pokazuje alert mimo aktywnej flagi w tym samym cyklu", () => {
    seedLowBalance();
    checkLowBalance({ today: TODAY });

    expect(checkLowBalance({ today: TODAY, force: true })).toBe(true);
    expect(warning).toHaveBeenCalledTimes(2);
  });

  it("zmiana progu na wyższy + force → natychmiastowy alert", () => {
    useTransactionsStore.setState({ transactions: [income({ amount: 800, date: "2026-11-02" })] });
    expect(checkLowBalance({ today: TODAY })).toBe(false);

    useSettingsStore.getState().updateSettings({ lowBalanceThreshold: 1000 });
    expect(checkLowBalance({ today: TODAY, force: true })).toBe(true);
    expect(warning).toHaveBeenCalledTimes(1);
  });

  it("próg 0 wyłącza alert nawet przy ujemnym saldzie", () => {
    useSettingsStore.getState().updateSettings({ lowBalanceThreshold: 0 });
    useTransactionsStore.setState({ transactions: [tx({ amount: 400, date: "2026-11-02" })] });

    expect(checkLowBalance({ today: TODAY, force: true })).toBe(false);
    expect(warning).not.toHaveBeenCalled();
  });

  it("pusta historia przy progu 500 → saldo 0 jest poniżej progu", () => {
    expect(checkLowBalance({ today: TODAY })).toBe(true);
    expect(warning).toHaveBeenCalledWith(lowBalanceMessage(0, 0), {
      id: "low-balance",
      duration: 10_000,
    });
  });
});

describe("useAlertStore", () => {
  it("markLowBalanceTriggered zapisuje cykl, resetLowBalanceFlag go czyści", () => {
    useAlertStore.getState().markLowBalanceTriggered("2026-11-01");
    expect(useAlertStore.getState().lowBalanceAlertTriggered).toBe(true);
    expect(useAlertStore.getState().alertCycleStart).toBe("2026-11-01");

    useAlertStore.getState().resetLowBalanceFlag();
    expect(useAlertStore.getState().lowBalanceAlertTriggered).toBe(false);
    expect(useAlertStore.getState().alertCycleStart).toBeNull();
  });
});
