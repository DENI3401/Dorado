import { useId } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  savedCategoryMessage,
  useCategoryForm,
  type Category,
} from "@/features/categories";
import { TRANSACTION_TYPE_LABELS } from "@/features/transactions";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "./CategoryBadge";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Przekaż, aby edytować własną kategorię. */
  category?: Category;
}

const TYPE_OPTIONS = [
  { value: "expense", label: TRANSACTION_TYPE_LABELS.expense },
  { value: "income", label: TRANSACTION_TYPE_LABELS.income },
] as const;

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <CategoryFormBody category={category} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CategoryFormBody({ category, onClose }: { category?: Category; onClose: () => void }) {
  const { form, submit, isEditing, typeLocked } = useCategoryForm({
    category,
    onSaved: (event) => {
      toast.success(savedCategoryMessage(event));
      onClose();
    },
  });
  const {
    register,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const id = useId();

  const [name, icon, color] = watch(["name", "icon", "color"]);
  const isCustomColor = !(CATEGORY_COLORS as readonly string[]).includes(color);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edytuj kategorię" : "Nowa kategoria"}</DialogTitle>
        <DialogDescription>
          {typeLocked
            ? "Typ istniejącej kategorii jest zablokowany, bo używają go już operacje."
            : "Wybierz nazwę, typ, ikonę i kolor."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} noValidate className="grid gap-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
          <CategoryBadge icon={icon} color={color} />
          <span className="truncate text-sm font-medium">{name.trim() || "Nazwa kategorii"}</span>
        </div>

        <Field label="Nazwa" htmlFor={`${id}-name`} error={errors.name?.message}>
          <input
            id={`${id}-name`}
            type="text"
            maxLength={30}
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
            className={inputClass}
            {...register("name")}
          />
        </Field>

        <Field label="Typ" labelId={`${id}-type`} error={errors.type?.message}>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Segmented
                label="Typ kategorii"
                value={field.value}
                onChange={field.onChange}
                options={TYPE_OPTIONS}
                disabled={typeLocked}
              />
            )}
          />
        </Field>

        <Field label="Ikona" labelId={`${id}-icon`} error={errors.icon?.message}>
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-labelledby={`${id}-icon`}
                className="grid grid-cols-6 gap-1.5 sm:grid-cols-8"
              >
                {CATEGORY_ICONS.map((iconName) => {
                  const active = field.value === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={iconName}
                      title={iconName}
                      onClick={() => field.onChange(iconName)}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                        active && "text-foreground",
                      )}
                      style={active ? { borderColor: color, backgroundColor: `${color}26` } : undefined}
                    >
                      <CategoryIcon
                        name={iconName}
                        className="size-4.5"
                        style={active ? { color } : undefined}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          />
        </Field>

        <Field label="Kolor" labelId={`${id}-color`} error={errors.color?.message}>
          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-labelledby={`${id}-color`}
                className="flex flex-wrap items-center gap-2"
              >
                {CATEGORY_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    role="radio"
                    aria-checked={field.value === hex}
                    aria-label={hex}
                    onClick={() => field.onChange(hex)}
                    className={cn(
                      "size-7 rounded-full outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50",
                      field.value === hex && "ring-2 ring-foreground ring-offset-2 ring-offset-popover",
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <label
                  className={cn(
                    "relative inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs text-muted-foreground transition focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted",
                    isCustomColor && "border-foreground text-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="size-3.5 rounded-full border"
                    style={{ backgroundColor: field.value }}
                  />
                  Własny
                  <input
                    type="color"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    aria-label="Własny kolor"
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
              </div>
            )}
          />
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 text-white hover:bg-indigo-500"
          >
            {isEditing ? "Zapisz kategorię" : "Dodaj kategorię"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
