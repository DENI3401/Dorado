import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { useAllCategories } from "@/features/categories";
import {
  INCOME_KIND_LABELS,
  TRANSACTION_TYPE_LABELS,
  type IncomeKind,
  type useTransactionFilters,
} from "@/features/transactions";
import { cn } from "@/lib/utils";

type FiltersApi = ReturnType<typeof useTransactionFilters>;

interface TransactionFiltersProps {
  filters: FiltersApi["filters"];
  setFilter: FiltersApi["setFilter"];
  reset: FiltersApi["reset"];
  isFiltering: boolean;
}

const TYPE_OPTIONS = [
  { value: "all", label: "Wszystkie" },
  { value: "income", label: TRANSACTION_TYPE_LABELS.income },
  { value: "expense", label: TRANSACTION_TYPE_LABELS.expense },
] as const;

const numberOrNull = (value: string) => (value === "" ? null : Number(value));

export function TransactionFilters({ filters, setFilter, reset, isFiltering }: TransactionFiltersProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const categories = useAllCategories();

  const visibleCategories =
    filters.type === "all" ? categories : categories.filter((c) => c.type === filters.type);
  const moreCount =
    filters.categoryIds.length +
    (filters.amountMin !== null ? 1 : 0) +
    (filters.amountMax !== null ? 1 : 0);

  const toggleCategory = (id: string) =>
    setFilter(
      "categoryIds",
      filters.categoryIds.includes(id)
        ? filters.categoryIds.filter((x) => x !== id)
        : [...filters.categoryIds, id],
    );

  return (
    <section aria-label="Filtry" className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => setFilter("query", e.target.value)}
            placeholder="Szukaj w notatkach i kategoriach"
            aria-label="Szukaj operacji"
            className={cn(inputClass, "pl-9")}
          />
        </div>

        <Segmented
          label="Typ operacji"
          value={filters.type}
          onChange={(value) => {
            setFilter("type", value);
            if (value === "expense") setFilter("incomeKind", "all");
            // Kategorie z drugiego typu nie mają już sensu w filtrze.
            if (value !== "all") {
              setFilter(
                "categoryIds",
                filters.categoryIds.filter((id) => categories.find((c) => c.id === id)?.type === value),
              );
            }
          }}
          options={TYPE_OPTIONS}
          className="w-auto"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          Od
          <input
            type="date"
            value={filters.dateFrom ?? ""}
            max={filters.dateTo ?? undefined}
            onChange={(e) => setFilter("dateFrom", e.target.value || null)}
            className={cn(inputClass, "w-auto text-foreground")}
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          Do
          <input
            type="date"
            value={filters.dateTo ?? ""}
            min={filters.dateFrom ?? undefined}
            onChange={(e) => setFilter("dateTo", e.target.value || null)}
            className={cn(inputClass, "w-auto text-foreground")}
          />
        </label>

        {filters.type !== "expense" && (
          <select
            value={filters.incomeKind}
            onChange={(e) => setFilter("incomeKind", e.target.value as "all" | IncomeKind)}
            aria-label="Rodzaj przychodu"
            className={cn(inputClass, "w-auto")}
          >
            <option value="all">Każdy rodzaj przychodu</option>
            {(Object.keys(INCOME_KIND_LABELS) as IncomeKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {INCOME_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilter("sortBy", e.target.value as "date" | "amount")}
            aria-label="Sortuj według"
            className={cn(inputClass, "w-auto")}
          >
            <option value="date">Sortuj: data</option>
            <option value="amount">Sortuj: kwota</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => setFilter("sortDir", filters.sortDir === "asc" ? "desc" : "asc")}
            aria-label={
              filters.sortDir === "asc" ? "Kolejność rosnąca — zmień na malejącą" : "Kolejność malejąca — zmień na rosnącą"
            }
          >
            {filters.sortDir === "asc" ? <ArrowUp /> : <ArrowDown />}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-controls="more-filters"
        >
          Kategorie i kwota{moreCount > 0 ? ` (${moreCount})` : ""}
          <ChevronDown className={cn("transition-transform", moreOpen && "rotate-180")} />
        </Button>
        {isFiltering && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <X /> Wyczyść filtry
          </Button>
        )}
      </div>

      {moreOpen && (
        <div id="more-filters" className="grid gap-3 rounded-xl border bg-card p-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kategorie">
            {visibleCategories.map((category) => {
              const active = filters.categoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "inline-flex h-8 pointer-coarse:h-10 items-center gap-1.5 rounded-full border px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active ? "font-medium" : "text-muted-foreground hover:bg-muted",
                  )}
                  style={
                    active
                      ? { borderColor: category.color, backgroundColor: `${category.color}1f` }
                      : undefined
                  }
                >
                  <CategoryIcon
                    name={category.icon}
                    className="size-3.5"
                    style={{ color: category.color }}
                  />
                  {category.name}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              Kwota od
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={filters.amountMin ?? ""}
                onChange={(e) => setFilter("amountMin", numberOrNull(e.target.value))}
                className={cn(inputClass, "w-28 text-foreground tabular-nums")}
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              do
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={filters.amountMax ?? ""}
                onChange={(e) => setFilter("amountMax", numberOrNull(e.target.value))}
                className={cn(inputClass, "w-28 text-foreground tabular-nums")}
              />
            </label>
            <span className="text-sm text-muted-foreground">zł</span>
          </div>
        </div>
      )}
    </section>
  );
}
