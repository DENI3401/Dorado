import { useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";

function readInitial(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored === "dark";
  } catch {
    // localStorage niedostępny (tryb prywatny) — przejdź do ustawień systemu.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

// Jeden wspólny stan motywu dla całej aplikacji. Wcześniej każde wywołanie
// useTheme() miało własny useState, więc Toaster nie widział przełącznika z AppLayout.
let dark = readInitial();
const listeners = new Set<() => void>();

function applyClass() {
  document.documentElement.classList.toggle("dark", dark);
}
applyClass();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function toggle() {
  dark = !dark;
  applyClass();
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // brak zapisu nie powinien blokować przełączenia motywu
  }
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const isDark = useSyncExternalStore(
    subscribe,
    () => dark,
    () => false,
  );
  return { dark: isDark, toggle };
}
