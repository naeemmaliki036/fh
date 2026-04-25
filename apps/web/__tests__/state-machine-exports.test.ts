/**
 * State-machine export tests.
 *
 * Confirms DEAL_STAGE_TRANSITIONS and STAGE_TRANSITIONS export
 * correctly structured maps and that legal-next-stage filtering
 * returns the expected sets.
 */

import { describe, it, expect } from "vitest";
import { STAGE_TRANSITIONS, TERMINAL_STAGES } from "@/lib/types/lead";
import { DEAL_STAGE_TRANSITIONS, DEAL_TERMINAL_STAGES } from "@/lib/types/deal";

// ---------------------------------------------------------------------------
// Lead state machine
// ---------------------------------------------------------------------------

describe("STAGE_TRANSITIONS (lead)", () => {
  it("exports an object with all 7 lead stages as keys", () => {
    const expected = ["new", "contacted", "qualified", "viewing", "offer", "won", "lost"];
    expect(Object.keys(STAGE_TRANSITIONS).sort()).toEqual(expected.sort());
  });

  it("terminal stages have empty next-stage arrays", () => {
    expect(STAGE_TRANSITIONS.won).toEqual([]);
    expect(STAGE_TRANSITIONS.lost).toEqual([]);
  });

  it("new → contacted and new → lost are legal", () => {
    expect(STAGE_TRANSITIONS.new).toContain("contacted");
    expect(STAGE_TRANSITIONS.new).toContain("lost");
  });

  it("new → qualified is NOT in legal transitions", () => {
    expect(STAGE_TRANSITIONS.new).not.toContain("qualified");
  });

  it("viewing can go backwards to qualified", () => {
    expect(STAGE_TRANSITIONS.viewing).toContain("qualified");
  });

  it("TERMINAL_STAGES contains won and lost", () => {
    expect(TERMINAL_STAGES.has("won")).toBe(true);
    expect(TERMINAL_STAGES.has("lost")).toBe(true);
  });

  it("TERMINAL_STAGES does not contain active stages", () => {
    expect(TERMINAL_STAGES.has("new")).toBe(false);
    expect(TERMINAL_STAGES.has("offer")).toBe(false);
  });

  it("legal-next filtering returns expected set from 'offer'", () => {
    const legalNext = new Set(STAGE_TRANSITIONS.offer);
    expect(legalNext).toEqual(new Set(["won", "lost", "viewing"]));
  });
});

// ---------------------------------------------------------------------------
// Deal state machine
// ---------------------------------------------------------------------------

describe("DEAL_STAGE_TRANSITIONS", () => {
  it("exports an object with all 6 deal stages as keys", () => {
    const expected = [
      "initiated", "documents_pending", "deposit_pending",
      "closed_won", "closed_lost", "canceled",
    ];
    expect(Object.keys(DEAL_STAGE_TRANSITIONS).sort()).toEqual(expected.sort());
  });

  it("terminal deal stages have empty arrays", () => {
    expect(DEAL_STAGE_TRANSITIONS.closed_won).toEqual([]);
    expect(DEAL_STAGE_TRANSITIONS.closed_lost).toEqual([]);
    expect(DEAL_STAGE_TRANSITIONS.canceled).toEqual([]);
  });

  it("initiated can go to documents_pending, canceled, closed_lost", () => {
    const legal = new Set(DEAL_STAGE_TRANSITIONS.initiated);
    expect(legal.has("documents_pending")).toBe(true);
    expect(legal.has("canceled")).toBe(true);
    expect(legal.has("closed_lost")).toBe(true);
  });

  it("initiated cannot jump to deposit_pending or closed_won", () => {
    const legal = DEAL_STAGE_TRANSITIONS.initiated;
    expect(legal).not.toContain("deposit_pending");
    expect(legal).not.toContain("closed_won");
  });

  it("documents_pending can go back to initiated", () => {
    expect(DEAL_STAGE_TRANSITIONS.documents_pending).toContain("initiated");
  });

  it("DEAL_TERMINAL_STAGES contains all three terminal stages", () => {
    expect(DEAL_TERMINAL_STAGES.has("closed_won")).toBe(true);
    expect(DEAL_TERMINAL_STAGES.has("closed_lost")).toBe(true);
    expect(DEAL_TERMINAL_STAGES.has("canceled")).toBe(true);
  });

  it("DEAL_TERMINAL_STAGES does not include active stages", () => {
    expect(DEAL_TERMINAL_STAGES.has("initiated")).toBe(false);
    expect(DEAL_TERMINAL_STAGES.has("deposit_pending")).toBe(false);
  });
});
