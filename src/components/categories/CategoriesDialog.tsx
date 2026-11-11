import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  confirmRemoveCategoryText,
  removedCategoryMessage,
  useAllCategories,
  type Category,
} from "@/features/categories";
import {
  TRANSACTION_TYPE_LABELS,
  countTransactionsInCategory,
  deleteCategory,
  type TransactionType,
} from "@/features/transactions";
import { CategoryBadge } from "./CategoryBadge";
import { CategoryFormDialog } from "./CategoryFormDialog";

interface CategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROUPS: { type: TransactionType; title: string }[] = [
  { type: "expense", title: `${TRANSACTION_TYPE_LABELS.expense}y` },
  { type: "income", title: `${TRANSACTION_TYPE_LABELS.income}y` },
];

export function CategoriesDialog({ open, onOpenChange }: CategoriesDialogProps) {
  const categories = useAllCategories();

  // Jak w pozostałych modalach: `open` osobno od celu, żeby treść nie migała przy zamykaniu.
  const [editor, setEditor] = useState<{ open: boolean; category?: Category }>({ open: false });
  const [removal, setRemoval] = useState<{
    open: boolean;
    category: Category | null;
    usedBy: number;
  }>({ open: false, category: null, usedBy: 0 });

  const askRemove = (category: Category) =>
    setRemoval({ open: true, category, usedBy: countTransactionsInCategory(category.id) });

  const confirmRemove = () => {
    if (!removal.category) return;
    toast(removedCategoryMessage(deleteCategory(removal.category.id)));
    setRemoval((prev) => ({ ...prev, open: false }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kategorie</DialogTitle>
          <DialogDescription>
            Kategorie domyślne są stałe. Własne możesz edytować i usuwać — operacje usuniętej
            kategorii trafią do kategorii „Inne”.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto pr-1">
          {GROUPS.map((group) => (
            <section key={group.type} aria-label={group.title} className="mb-4 last:mb-0">
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">{group.title}</h3>
              <ul className="divide-y rounded-lg border">
                {categories
                  .filter((c) => c.type === group.type)
                  .map((category) => (
                    <li key={category.id} className="flex items-center gap-3 px-3 py-2">
                      <CategoryBadge
                        icon={category.icon}
                        color={category.color}
                        className="size-8"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
                      {category.isDefault ? (
                        <span className="text-xs text-muted-foreground">domyślna</span>
                      ) : (
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edytuj kategorię: ${category.name}`}
                            onClick={() => setEditor({ open: true, category })}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Usuń kategorię: ${category.name}`}
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => askRemove(category)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>

        <Button
          type="button"
          className="bg-indigo-600 text-white hover:bg-indigo-500"
          onClick={() => setEditor({ open: true })}
        >
          <Plus /> Nowa kategoria
        </Button>

        {/* Okna zagnieżdżone — otwierają się nad listą kategorii. */}
        <CategoryFormDialog
          open={editor.open}
          onOpenChange={(next) => setEditor((prev) => ({ ...prev, open: next }))}
          category={editor.category}
        />

        <AlertDialog
          open={removal.open}
          onOpenChange={(next) => setRemoval((prev) => ({ ...prev, open: next }))}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunąć kategorię?</AlertDialogTitle>
              <AlertDialogDescription>
                {removal.category
                  ? confirmRemoveCategoryText(removal.category.name, removal.usedBy)
                  : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmRemove}>
                Usuń
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
