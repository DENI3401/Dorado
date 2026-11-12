import { createElement } from "react";
import type { LucideProps } from "lucide-react";
import { getCategoryIcon } from "./categoryIcons";

interface CategoryIconProps extends LucideProps {
  /** Nazwa ikony zapisana w danych kategorii, np. "Utensils". */
  name: string;
}

/**
 * Ikona kategorii wybrana po nazwie. Używamy createElement zamiast
 * `const Icon = getCategoryIcon(...)` + `<Icon />`, żeby nie tworzyć
 * komponentu w trakcie renderu (reguła react/static-components).
 */
export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  return createElement(getCategoryIcon(name), props);
}
