import { describe, expect, it } from "vitest";
import { formatPLN } from "@/features/transactions/utils/money";
import { lowBalanceMessage } from "./messages";

describe("lowBalanceMessage", () => {
  it("formatuje kwoty przez formatPLN", () => {
    const message = lowBalanceMessage(6500, 750);
    expect(message).toBe(
      `Wydałeś już ${formatPLN(6500)}. Na Twoim koncie pozostało tylko ${formatPLN(750)}`,
    );
    expect(message).toContain("Wydałeś już");
    expect(message).toContain("pozostało tylko");
  });

  it("pokazuje grosze i zaokrąglone kwoty", () => {
    expect(lowBalanceMessage(99.5, 0.3)).toBe(
      `Wydałeś już ${formatPLN(99.5)}. Na Twoim koncie pozostało tylko ${formatPLN(0.3)}`,
    );
  });
});
