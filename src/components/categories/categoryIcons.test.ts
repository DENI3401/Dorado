import { describe, expect, it } from "vitest";
import { Ellipsis } from "lucide-react";
import { CATEGORY_ICONS } from "@/features/categories/defaultCategories";
import { CATEGORY_ICON_MAP, getCategoryIcon } from "./categoryIcons";

describe("getCategoryIcon", () => {
  it("każda ikona z kreatora kategorii ma komponent (także nowe dla płatności cyklicznych)", () => {
    expect(Object.keys(CATEGORY_ICON_MAP).sort()).toEqual([...CATEGORY_ICONS].sort());
    for (const name of ["ShieldCheck", "Wifi", "Zap", "Tv", "Cloud", "Bus"]) {
      expect(getCategoryIcon(name)).not.toBe(Ellipsis);
    }
  });

  it("nieznana nazwa (np. z uszkodzonych danych) daje ikonę „Ellipsis”", () => {
    expect(getCategoryIcon("NieMaTakiej")).toBe(Ellipsis);
  });
});
