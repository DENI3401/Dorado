import type { CategorySavedEvent } from "./hooks/useCategoryForm";
import type { DeleteCategoryResult } from "@/features/transactions/actions";

export function savedCategoryMessage(event: CategorySavedEvent): string {
  return event.action === "created"
    ? `Dodano kategorię „${event.category.name}”`
    : `Zapisano kategorię „${event.category.name}”`;
}

/** Tekst do modalu potwierdzenia usunięcia kategorii. */
export function confirmRemoveCategoryText(name: string, usedBy: number): string {
  return usedBy > 0
    ? `Kategoria „${name}” jest użyta w ${usedBy} operacjach. Zostaną przeniesione do kategorii „Inne”. Kontynuować?`
    : `Czy na pewno usunąć kategorię „${name}”?`;
}

export function removedCategoryMessage(result: DeleteCategoryResult): string {
  if (!result.ok) {
    return result.reason === "default"
      ? "Kategorii domyślnych nie można usuwać"
      : "Nie znaleziono kategorii";
  }
  return result.reassigned > 0
    ? `Usunięto kategorię „${result.category.name}”, przeniesiono operacje: ${result.reassigned}`
    : `Usunięto kategorię „${result.category.name}”`;
}
