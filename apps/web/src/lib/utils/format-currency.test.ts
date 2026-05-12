import { describe, it, expect } from "vitest";
import { formatAed } from "@/lib/utils/format-currency";

describe("formatAed", () => {
  it("formats one million as AED 1,000,000", () => {
    expect(formatAed(1_000_000)).toBe("AED 1,000,000");
  });

  it("formats 500 as AED 500", () => {
    expect(formatAed(500)).toBe("AED 500");
  });

  it("formats zero as AED 0", () => {
    expect(formatAed(0)).toBe("AED 0");
  });

  it("drops fractional digits", () => {
    // maximumFractionDigits: 0 — 999.99 rounds to 1,000
    expect(formatAed(999.99)).toBe("AED 1,000");
  });
});
