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
import { getCategoryIcon } from "@/components/categories/categoryIcons";
import {
  INCOME_KIND_LABELS,
  TRANSACTION_TYPE_LABELS,
  savedTransactionMessage,
  useTransactionForm,
  type IncomeKind,
  type Transaction,
  type TransactionType,
} from "@/features/transactions";
import { cn } from "@/lib/utils";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Przekaż, aby edytować istniejącą operację. */
  transaction?: Transaction;
  defaultType?: TransactionType;
}

const TYPE_OPTIONS = [
  {
    value: "expense",
    label: TRANSACTION_TYPE_LABELS.expense,
    activeClassName: "text-rose-600 dark:text-rose-400",
  },
  {
    value: "income",
    label: TRANSACTION_TYPE_LABELS.income,
    activeClassName: "text-emerald-600 dark:text-emerald-400",
  },
] as const;

const INCOME_KIND_OPTIONS = (Object.keys(INCOME_KIND_LABELS) as IncomeKind[]).map((value) => ({
  value,
  label: INCOME_KIND_LABELS[value],
}));

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  defaultType,
}: TransactionFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Treść montuje się dopiero po otwarciu, więc formularz zawsze startuje od czystego stanu. */}
        <TransactionFormBody
          transaction={transaction}
          defaultType={defaultType}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface BodyProps {
  transaction?: Transaction;
  defaultType?: TransactionType;
  onClose: () => void;
}

function TransactionFormBody({ transaction, defaultType, onClose }: BodyProps) {
  const { form, submit, categories, type, isEditing } = useTransactionForm({
    transaction,
    defaultType,
    onSaved: (event) => {
      toast.success(savedTransactionMessage(event));
      onClose();
    },
  });
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const id = useId();

  const title = isEditing
    ? "Edytuj operację"
    : type === "income"
      ? "Nowy przychód"
      : "Nowy wydatek";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Zmień dane operacji i zapisz."
            : "Kwotę wpisz zwykłą liczbą, np. 12,50 — znak wynika z typu operacji."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} noValidate className="grid gap-4">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Segmented
              label="Typ operacji"
              value={field.value}
              onChange={field.onChange}
              options={TYPE_OPTIONS}
            />
          )}
        />

        {type === "income" && (
          <Field label="Rodzaj przychodu" labelId={`${id}-kind`} error={errors.incomeKind?.message}>
            <Controller
              control={control}
              name="incomeKind"
              render={({ field }) => (
                <Segmented
                  label="Rodzaj przychodu"
                  value={field.value ?? "bonus"}
                  onChange={field.onChange}
                  options={INCOME_KIND_OPTIONS}
                />
              )}
            />
          </Field>
        )}

        <Field label="Kwota" htmlFor={`${id}-amount`} error={errors.amount?.message}>
          <div className="relative">
            <input
              id={`${id}-amount`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              aria-invalid={errors.amount ? true : undefined}
              className={cn(inputClass, "pr-9 text-right tabular-nums")}
              {...register("amount")}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground"
            >
              zł
            </span>
          </div>
        </Field>

        <Field label="Kategoria" labelId={`${id}-category`} error={errors.categoryId?.message}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-labelledby={`${id}-category`}
                className="flex flex-wrap gap-1.5"
              >
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category.icon);
                  const active = field.value === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(category.id)}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        active ? "font-medium" : "text-muted-foreground hover:bg-muted",
                      )}
                      style={
                        active
                          ? { borderColor: category.color, backgroundColor: `${category.color}1f` }
                          : undefined
                      }
                    >
                      <Icon className="size-3.5" style={{ color: category.color }} />
                      {category.name}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </Field>

        <Field label="Data" htmlFor={`${id}-date`} error={errors.date?.message}>
          <input
            id={`${id}-date`}
            type="date"
            aria-invalid={errors.date ? true : undefined}
            className={inputClass}
            {...register("date")}
          />
        </Field>

        <Field label="Notatka (opcjonalnie)" htmlFor={`${id}-note`} error={errors.note?.message}>
          <textarea
            id={`${id}-note`}
            rows={2}
            maxLength={200}
            aria-invalid={errors.note ? true : undefined}
            className={cn(inputClass, "h-auto min-h-16 resize-none py-2")}
            {...register("note")}
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
            {isEditing ? "Zapisz zmiany" : type === "income" ? "Dodaj przychód" : "Dodaj wydatek"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
