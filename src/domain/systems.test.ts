import { describe, expect, it } from "vitest";
import { autofillCourt } from "@/domain/systems";
import { validateLineup } from "@/domain/validation";
import { createDemoPlayers } from "@/data/seed";
import { occupiedPlayerIds } from "@/domain/rotation";

describe("autofillCourt", () => {
  it("fills six unique players for 5-1", () => {
    const players = createDemoPlayers(1);
    const court = autofillCourt(players, "5-1");
    const ids = occupiedPlayerIds(court);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
  });
});

describe("validateLineup", () => {
  it("warns on incomplete court without blocking", () => {
    const players = createDemoPlayers(1);
    const issues = validateLineup(
      { 1: "p-owen", 2: null, 3: null, 4: null, 5: null, 6: null },
      players,
      "5-1",
      "p-leo",
    );
    expect(issues.some((i) => i.code === "incomplete_court")).toBe(true);
  });

  it("accepts demo 5-1 sample", () => {
    const players = createDemoPlayers(1);
    const court = {
      1: "p-owen",
      2: "p-felix",
      3: "p-cole",
      4: "p-marcus",
      5: "p-devon",
      6: "p-isaac",
    } as const;
    const issues = validateLineup(court, players, "5-1", "p-leo");
    expect(issues.filter((i) => i.severity === "warning")).toHaveLength(0);
  });
});
