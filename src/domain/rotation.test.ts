import { describe, expect, it } from "vitest";
import {
  courtAtRotation,
  rotateClockwise,
  rotateCounterClockwise,
  rotationLabel,
} from "@/domain/rotation";
import { emptyCourt, type CourtAssignment } from "@/domain/types";

function labeledCourt(): CourtAssignment {
  return { 1: "a", 2: "b", 3: "c", 4: "d", 5: "e", 6: "f" };
}

describe("rotateClockwise", () => {
  it("moves zone 2 player into zone 1 (new server)", () => {
    const next = rotateClockwise(labeledCourt());
    expect(next[1]).toBe("b");
    expect(next[2]).toBe("c");
    expect(next[3]).toBe("d");
    expect(next[4]).toBe("e");
    expect(next[5]).toBe("f");
    expect(next[6]).toBe("a");
  });

  it("returns to start after 6 rotates", () => {
    let court = labeledCourt();
    for (let i = 0; i < 6; i += 1) court = rotateClockwise(court);
    expect(court).toEqual(labeledCourt());
  });

  it("undoes with counter-clockwise", () => {
    const start = labeledCourt();
    expect(rotateCounterClockwise(rotateClockwise(start))).toEqual(start);
  });
});

describe("courtAtRotation", () => {
  it("matches successive rotates", () => {
    const start = labeledCourt();
    let manual = start;
    for (let i = 0; i < 6; i += 1) {
      expect(courtAtRotation(start, i)).toEqual(manual);
      manual = rotateClockwise(manual);
    }
  });
});

describe("rotationLabel", () => {
  it("labels R1–R6", () => {
    expect(rotationLabel(0)).toBe("R1");
    expect(rotationLabel(5)).toBe("R6");
    expect(rotationLabel(6)).toBe("R1");
  });
});

describe("emptyCourt", () => {
  it("has six null zones", () => {
    expect(emptyCourt()).toEqual({
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
    });
  });
});
