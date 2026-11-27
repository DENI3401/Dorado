import type { SyncedThrough } from "./planSubscriptionPayments";

/** Klucz w localStorage: do kiedy płatności każdej subskrypcji zostały już zaksięgowane. */
export const SUBSCRIPTION_SYNC_STORAGE_KEY = "dorado-subscription-sync";

export function readSyncedThrough(): SyncedThrough {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SUBSCRIPTION_SYNC_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as SyncedThrough) : {};
  } catch {
    return {};
  }
}

export function writeSyncedThrough(value: SyncedThrough): void {
  try {
    localStorage.setItem(SUBSCRIPTION_SYNC_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // brak zapisu (tryb prywatny) — w najgorszym razie płatności policzą się ponownie po odświeżeniu
  }
}
