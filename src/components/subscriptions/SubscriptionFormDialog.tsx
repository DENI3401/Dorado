import { useId, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import {
  BILLING_PERIOD_LABELS,
  savedSubscriptionMessage,
  useSubscriptionForm,
  type Subscription,
} from "@/features/subscriptions";
import { cn } from "@/lib/utils";
import { SubscriptionCategoryPicker } from "./SubscriptionCategoryPicker";

interface SubscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Przekaż, aby edytować istniejącą subskrypcję. */
  subscription?: Subscription;
}

const PERIOD_OPTIONS = [
  { value: "monthly", label: BILLING_PERIOD_LABELS.monthly },
  { value: "yearly", label: BILLING_PERIOD_LABELS.yearly },
] as const;

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  subscription,
}: SubscriptionFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Treść montuje się dopiero po otwarciu, więc formularz zawsze startuje od czystego stanu. */}
        <SubscriptionFormBody subscription={subscription} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface BodyProps {
  subscription?: Subscription;
  onClose: () => void;
}

function SubscriptionFormBody({ subscription, onClose }: BodyProps) {
  const { form, submit, isEditing, categories, selectCategory } = useSubscriptionForm({
    subscription,
    onSaved: (event) => {
      toast.success(savedSubscriptionMessage(event));
      onClose();
    },
  });
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const id = useId();
  const [creatingCategory, setCreatingCategory] = useState(false);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edytuj subskrypcję" : "Nowa subskrypcja"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Zmiany obejmą kolejne płatności. Historia transakcji zostaje bez zmian."
            : "Stałą opłatę, np. streaming czy telefon, zobaczysz potem w kalendarzu płatności."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col gap-4">
        <DialogBody>
          <Field label="Nazwa" htmlFor={`${id}-name`} error={errors.name?.message}>
            <input
              id={`${id}-name`}
              type="text"
              maxLength={40}
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              className={inputClass}
              {...register("name")}
            />
          </Field>

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

          <Field
            label="Kategoria"
            labelId={`${id}-category`}
            error={errors.categoryId?.message}
            hint="Płatności tej subskrypcji trafią do Transakcji w tej kategorii."
          >
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <SubscriptionCategoryPicker
                  categories={categories}
                  value={field.value}
                  onChange={field.onChange}
                  onCreate={() => setCreatingCategory(true)}
                  labelId={`${id}-category`}
                />
              )}
            />
          </Field>

          <Field label="Okres płatności" labelId={`${id}-period`} error={errors.period?.message}>
            <Controller
              control={control}
              name="period"
              render={({ field }) => (
                <Segmented
                  label="Okres płatności"
                  value={field.value}
                  onChange={field.onChange}
                  options={PERIOD_OPTIONS}
                />
              )}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Pierwsza płatność"
              htmlFor={`${id}-start`}
              error={errors.startDate?.message}
              hint="Dzień tej daty wyznacza dzień płatności."
            >
              <input
                id={`${id}-start`}
                type="date"
                aria-invalid={errors.startDate ? true : undefined}
                className={inputClass}
                {...register("startDate")}
              />
            </Field>
            <Field
              label="Koniec (opcjonalnie)"
              htmlFor={`${id}-end`}
              error={errors.endDate?.message}
              hint="Zostaw puste, jeśli subskrypcja nie ma końca."
            >
              <input
                id={`${id}-end`}
                type="date"
                aria-invalid={errors.endDate ? true : undefined}
                className={inputClass}
                {...register("endDate")}
              />
            </Field>
          </div>

          <Field label="Notatka (opcjonalnie)" htmlFor={`${id}-note`} error={errors.note?.message}>
            <textarea
              id={`${id}-note`}
              rows={2}
              maxLength={200}
              aria-invalid={errors.note ? true : undefined}
              className={cn(inputClass, "h-auto pointer-coarse:h-auto min-h-16 resize-none py-2")}
              {...register("note")}
            />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 text-white hover:bg-indigo-500"
          >
            {isEditing ? "Zapisz zmiany" : "Dodaj subskrypcję"}
          </Button>
        </DialogFooter>
      </form>

      {/*
        Okno zagnieżdżone, poza <form> subskrypcji: w drzewie Reacta zdarzenia przechodzą przez portale,
        więc zatwierdzenie formularza kategorii wewnątrz <form> wysłałoby też formularz subskrypcji.
      */}
      <CategoryFormDialog
        open={creatingCategory}
        onOpenChange={setCreatingCategory}
        forSubscriptions
        onSaved={(event) => selectCategory(event.category.id)}
      />
    </>
  );
}
