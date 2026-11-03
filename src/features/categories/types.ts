import type { TransactionType } from "@/features/transactions/types";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  /** Nazwa ikony z lucide-react (np. "Utensils"); mapowanie na komponent robi warstwa UI. */
  icon: string;
  /** Kolor HEX, np. "#22c55e". */
  color: string;
  isDefault: boolean;
}
