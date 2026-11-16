import { useId, useMemo, useState } from "react";
import { Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatStrip } from "@/components/ui/stat-strip";
import { DeleteSubscriptionDialog } from "@/components/subscriptions/DeleteSubscriptionDialog";
import { SubscriptionCard } from "@/components/subscriptions/SubscriptionCard";
import { SubscriptionFormDialog } from "@/components/subscriptions/SubscriptionFormDialog";
import { EmptyState } from "@/components/transactions/TransactionsEmptyState";
import { useAllCategories } from "@/features/categories";
import {
  pausedSubscriptionMessage,
  resumedSubscriptionMessage,
  useSubscriptionActions,
  useSubscriptions,
  type Subscription,
  type SubscriptionStatus,
} from "@/features/subscriptions";
import { formatPLN, todayIso } from "@/features/transactions";
import { toast } from "sonner";

const SECTION_TITLES: Record<SubscriptionStatus, string> = {
  active: "Aktywne",
  ended: "Zakończone",
  paused: "Wstrzymane",
};

export default function Subscriptions() {
  const { active, ended, paused, nextPaymentById, monthlyTotal, yearlyTotal, isEmpty } =
    useSubscriptions();
  const { setActive } = useSubscriptionActions();
  const categories = useAllCategories();
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const today = todayIso();
  const headingId = useId();

  // `open` osobno od celu, żeby treść modala nie migała podczas animacji zamykania.
  const [form, setForm] = useState<{ open: boolean; subscription?: Subscription }>({
    open: false,
  });
  const [deleting, setDeleting] = useState<{ open: boolean; subscription: Subscription | null }>({
    open: false,
    subscription: null,
  });

  const openCreate = () => setForm({ open: true });
  const openEdit = (subscription: Subscription) => setForm({ open: true, subscription });
  const askDelete = (subscription: Subscription) => setDeleting({ open: true, subscription });

  const toggleActive = (subscription: Subscription) => {
    const updated = setActive(subscription.id, !subscription.isActive);
    if (!updated) return;
    toast(updated.isActive ? resumedSubscriptionMessage(updated) : pausedSubscriptionMessage(updated));
  };

  const sections: { status: SubscriptionStatus; items: Subscription[] }[] = [
    { status: "active", items: active },
    { status: "ended", items: ended },
    { status: "paused", items: paused },
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Subskrypcje</h2>
        <Button size="lg" className="bg-indigo-600 text-white hover:bg-indigo-500" onClick={openCreate}>
          <Plus /> Dodaj subskrypcję
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Repeat}
          title="Nie masz jeszcze subskrypcji"
          description="Dodaj stałe opłaty, np. streaming czy telefon. Ich terminy pojawią się w kalendarzu płatności."
        >
          <Button size="lg" className="bg-indigo-600 text-white hover:bg-indigo-500" onClick={openCreate}>
            <Plus /> Dodaj pierwszą subskrypcję
          </Button>
        </EmptyState>
      ) : (
        <>
          <StatStrip
            label="Podsumowanie subskrypcji"
            items={[
              { label: "Miesięcznie", value: formatPLN(monthlyTotal) },
              { label: "Rocznie", value: formatPLN(yearlyTotal) },
              { label: "Aktywne", value: String(active.length) },
            ]}
            footnote={
              ended.length + paused.length > 0
                ? "Sumy obejmują tylko aktywne subskrypcje."
                : undefined
            }
          />

          {sections
            .filter((section) => section.items.length > 0)
            .map(({ status, items }) => (
              <section key={status} aria-labelledby={`${headingId}-${status}`} className="grid gap-2">
                <h3 id={`${headingId}-${status}`} className="text-sm font-medium text-muted-foreground">
                  {SECTION_TITLES[status]} ({items.length})
                </h3>
                <ul className="grid gap-3 md:grid-cols-2">
                  {items.map((s) => (
                    <SubscriptionCard
                      key={s.id}
                      subscription={s}
                      category={categoryById.get(s.categoryId)}
                      status={status}
                      nextPayment={nextPaymentById[s.id] ?? null}
                      today={today}
                      onEdit={openEdit}
                      onToggleActive={toggleActive}
                      onDelete={askDelete}
                    />
                  ))}
                </ul>
              </section>
            ))}
        </>
      )}

      <SubscriptionFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((prev) => ({ ...prev, open }))}
        subscription={form.subscription}
      />

      <DeleteSubscriptionDialog
        open={deleting.open}
        onOpenChange={(open) => setDeleting((prev) => ({ ...prev, open }))}
        subscription={deleting.subscription}
      />
    </div>
  );
}
