import { describe, expect, it } from "vitest";
import { exportRosterCsv, parseRosterCsv } from "@/lib/csv";
import type { Player } from "@/domain/types";

describe("parseRosterCsv", () => {
  it("parses Name,Position,Secondary schema", () => {
    const csv = [
      "Name,Position,Secondary",
      "Alex Demo,Setter,DS",
      "Jordan Sample,Outside,",
      "Casey Test,Libero,Middle",
    ].join("\n");
    const { players, errors } = parseRosterCsv(csv);
    expect(errors).toEqual([]);
    expect(players).toHaveLength(3);
    expect(players[0]).toMatchObject({
      name: "Alex Demo",
      primaryPosition: "S",
      secondaryPositions: ["DS"],
    });
    expect(players[2]).toMatchObject({
      name: "Casey Test",
      primaryPosition: "L",
      secondaryPositions: ["MB"],
    });
  });

  it("reports unknown positions", () => {
    const { players, errors } = parseRosterCsv(
      "Name,Position,Secondary\nPat,Wizard,",
    );
    expect(players).toHaveLength(0);
    expect(errors[0]).toContain("unknown position");
  });
});

describe("exportRosterCsv", () => {
  it("round-trips labels", () => {
    const players: Player[] = [
      {
        id: "1",
        name: "Alex Demo",
        jerseyNumber: 2,
        primaryPosition: "S",
        secondaryPositions: ["DS"],
        isActive: true,
        createdAt: 0,
        updatedAt: 0,
      },
    ];
    const csv = exportRosterCsv(players);
    const parsed = parseRosterCsv(csv);
    expect(parsed.players[0]?.name).toBe("Alex Demo");
    expect(parsed.players[0]?.primaryPosition).toBe("S");
  });
});
