import { describe, expect, it } from "vitest";
import {
  applyPlannedSubsForRotation,
  validatePlannedSubs,
} from "@/domain/planned-subs";
import { rotateClockwise } from "@/domain/rotation";
import { createDemoPlayers } from "@/data/seed";
import type { CourtAssignment, PlannedSub } from "@/domain/types";

const start: CourtAssignment = {
  1: "p-lord",
  2: "p-jack",
  3: "p-calvin",
  4: "p-ethan",
  5: "p-gyan",
  6: "p-emmett",
};

describe("applyPlannedSubsForRotation", () => {
  it("replaces outgoing player in their post-rotate zone", () => {
    const rotated = rotateClockwise(start);
    // After one rotate, jack (was Z2) is in Z1
    expect(rotated[1]).toBe("p-jack");
    const planned: PlannedSub[] = [
      {
        id: "1",
        atRotationIndex: 1,
        outPlayerId: "p-jack",
        inPlayerId: "p-milo",
      },
    ];
    const { court, applied, skipped } = applyPlannedSubsForRotation(
      rotated,
      planned,
      1,
    );
    expect(skipped).toHaveLength(0);
    expect(applied).toHaveLength(1);
    expect(court[1]).toBe("p-milo");
    // Other zones still hold rotated starters
    expect(court[2]).toBe("p-calvin");
  });

  it("skips when outgoing player is already off court", () => {
    const { skipped, applied } = applyPlannedSubsForRotation(
      start,
      [
        {
          id: "1",
          atRotationIndex: 0,
          outPlayerId: "p-marcelo",
          inPlayerId: "p-milo",
        },
      ],
      0,
    );
    expect(applied).toHaveLength(0);
    expect(skipped[0]?.reason).toMatch(/not on court/i);
  });
});

describe("validatePlannedSubs", () => {
  it("warns on incomplete plans", () => {
    const players = createDemoPlayers(1);
    const issues = validatePlannedSubs(
      [{ id: "1", atRotationIndex: 1, inPlayerId: "", outPlayerId: "p-jack" }],
      start,
      players,
    );
    expect(issues.some((i) => i.code === "planned_sub_incomplete")).toBe(true);
  });
});
