import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "./store";
import { DEFAULT_SETTINGS } from "./types";

beforeEach(() => {
  useSettingsStore.getState().resetSettings();
});

describe("useSettingsStore", () => {
  it("ma wartości domyślne: cykl od 1. dnia i próg 500 zł", () => {
    const { cycleStartDay, lowBalanceThreshold } = useSettingsStore.getState();
    expect({ cycleStartDay, lowBalanceThreshold }).toEqual(DEFAULT_SETTINGS);
    expect(cycleStartDay).toBe(1);
    expect(lowBalanceThreshold).toBe(500);
  });

  it("aktualizacja jednego pola nie zmienia drugiego", () => {
    useSettingsStore.getState().updateSettings({ cycleStartDay: 15 });
    expect(useSettingsStore.getState().cycleStartDay).toBe(15);
    expect(useSettingsStore.getState().lowBalanceThreshold).toBe(500);

    useSettingsStore.getState().updateSettings({ lowBalanceThreshold: 1200 });
    expect(useSettingsStore.getState().cycleStartDay).toBe(15);
    expect(useSettingsStore.getState().lowBalanceThreshold).toBe(1200);
  });

  it("updateSettings zwraca poprzednie wartości (do Undo)", () => {
    useSettingsStore.getState().updateSettings({ cycleStartDay: 10, lowBalanceThreshold: 300 });
    const previous = useSettingsStore.getState().updateSettings({ cycleStartDay: 20 });
    expect(previous).toEqual({ cycleStartDay: 10, lowBalanceThreshold: 300 });
    expect(useSettingsStore.getState().cycleStartDay).toBe(20);
  });

  it("Undo: ponowne zapisanie zwróconych wartości przywraca stan", () => {
    const previous = useSettingsStore.getState().updateSettings({ cycleStartDay: 25, lowBalanceThreshold: 0 });
    useSettingsStore.getState().updateSettings(previous);
    const { cycleStartDay, lowBalanceThreshold } = useSettingsStore.getState();
    expect({ cycleStartDay, lowBalanceThreshold }).toEqual(DEFAULT_SETTINGS);
  });

  it("pomija pola undefined zamiast nadpisywać je pustą wartością", () => {
    useSettingsStore.getState().updateSettings({ cycleStartDay: 12 });
    useSettingsStore.getState().updateSettings({ cycleStartDay: undefined, lowBalanceThreshold: 700 });
    expect(useSettingsStore.getState().cycleStartDay).toBe(12);
    expect(useSettingsStore.getState().lowBalanceThreshold).toBe(700);
  });

  it("resetSettings wraca do wartości domyślnych", () => {
    useSettingsStore.getState().updateSettings({ cycleStartDay: 31, lowBalanceThreshold: 9999 });
    useSettingsStore.getState().resetSettings();
    const { cycleStartDay, lowBalanceThreshold } = useSettingsStore.getState();
    expect({ cycleStartDay, lowBalanceThreshold }).toEqual(DEFAULT_SETTINGS);
  });
});
