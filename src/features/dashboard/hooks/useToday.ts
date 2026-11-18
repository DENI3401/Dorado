import { useEffect, useState } from "react";
import { todayIso } from "@/features/transactions/utils/isoDate";

/**
 * Dzisiejsza data YYYY-MM-DD, która sama się odświeża: o północy i po powrocie
 * do karty (np. następnego dnia). Dzięki temu Dashboard przechodzi do nowego cyklu
 * bez przeładowania strony.
 */
export function useToday(): string {
  const [today, setToday] = useState(() => todayIso());

  useEffect(() => {
    const refresh = () => setToday(todayIso());
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(refresh, midnight.getTime() - now.getTime() + 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [today]);

  return today;
}
