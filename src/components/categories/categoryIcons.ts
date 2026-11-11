import {
  BookOpen,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Ellipsis,
  Gamepad2,
  GraduationCap,
  Gift,
  HeartPulse,
  House,
  Laptop,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  Repeat,
  Shirt,
  ShoppingBag,
  Smartphone,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIcon } from "@/features/categories";

/** Nazwa ikony zapisana w danych → komponent lucide. */
export const CATEGORY_ICON_MAP: Record<CategoryIcon, LucideIcon> = {
  Utensils,
  Car,
  House,
  Receipt,
  Clapperboard,
  HeartPulse,
  ShoppingBag,
  Repeat,
  Ellipsis,
  Wallet,
  Gift,
  Laptop,
  PiggyBank,
  Plane,
  GraduationCap,
  Dumbbell,
  Gamepad2,
  Coffee,
  PawPrint,
  Smartphone,
  Shirt,
  BookOpen,
  Music,
};

/** Bezpieczne pobranie ikony — nieznana nazwa daje „Ellipsis”. */
export function getCategoryIcon(name: string): LucideIcon {
  return (CATEGORY_ICON_MAP as Record<string, LucideIcon>)[name] ?? Ellipsis;
}
