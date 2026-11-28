import { Plus } from "lucide-react";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import type { Category } from "@/features/categories";
import { cn } from "@/lib/utils";

interface SubscriptionCategoryPickerProps {
  /** Lista z useSubscriptionForm().categories — kategorie płatności cyklicznych. */
  categories: readonly Category[];
  value: string;
  onChange: (categoryId: string) => void;
  /** Otwiera okno „Nowa kategoria subskrypcji”. */
  onCreate: () => void;
  /** id etykiety pola (Field labelId). */
  labelId: string;
}

const chipClass =
  "inline-flex h-8 pointer-coarse:h-10 items-center gap-1.5 rounded-full border px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Wybór jednej kategorii (radiogroup) w formie „chipsów”, jak w formularzu transakcji.
 * Kategoria jest wymagana, więc ponowne kliknięcie wybranej nie zdejmuje wyboru.
 */
export function SubscriptionCategoryPicker({
  categories,
  value,
  onChange,
  onCreate,
  labelId,
}: SubscriptionCategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
        {categories.map((category) => {
          const active = category.id === value;
          return (
            <button
              key={category.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(category.id)}
              className={cn(chipClass, active ? "font-medium" : "text-muted-foreground hover:bg-muted")}
              style={
                active
                  ? { borderColor: category.color, backgroundColor: `${category.color}1f` }
                  : undefined
              }
            >
              <CategoryIcon name={category.icon} className="size-3.5" style={{ color: category.color }} />
              {category.name}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onCreate}
        className={cn(
          chipClass,
          "border-dashed text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Plus className="size-3.5" aria-hidden="true" />
        Nowa kategoria
      </button>
    </div>
  );
}
