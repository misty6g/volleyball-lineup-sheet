import {
  cloneCourt,
  emptyCourt,
  type CourtAssignment,
  type CourtZone,
} from "./types";

export { cloneCourt, emptyCourt };

/**
 * Standard volleyball rotation (side-out): each player moves one zone
 * along 1 → 6 → 5 → 4 → 3 → 2 → 1. Zone 1 is always the server.
 *
 * After one rotate, the player who was in zone 2 becomes the new server (zone 1).
 */
export const ROTATION_NEXT: Record<CourtZone, CourtZone> = {
  1: 6,
  6: 5,
  5: 4,
  4: 3,
  3: 2,
  2: 1,
};

/** Inverse of ROTATION_NEXT — used for undo-rotate without snapshots. */
export const ROTATION_PREV: Record<CourtZone, CourtZone> = {
  6: 1,
  5: 6,
  4: 5,
  3: 4,
  2: 3,
  1: 2,
};

export function rotateClockwise(court: CourtAssignment): CourtAssignment {
  const next = emptyCourt();
  (Object.keys(ROTATION_NEXT) as unknown as CourtZone[]).forEach((zone) => {
    const from = ROTATION_PREV[zone];
    next[zone] = court[from];
  });
  return next;
}

export function rotateCounterClockwise(court: CourtAssignment): CourtAssignment {
  const next = emptyCourt();
  (Object.keys(ROTATION_PREV) as unknown as CourtZone[]).forEach((zone) => {
    const from = ROTATION_NEXT[zone];
    next[zone] = court[from];
  });
  return next;
}

/** Apply n clockwise rotations to a starting court (n mod 6). */
export function courtAtRotation(
  starting: CourtAssignment,
  rotationIndex: number,
): CourtAssignment {
  const steps = ((rotationIndex % 6) + 6) % 6;
  let court = cloneCourt(starting);
  for (let i = 0; i < steps; i += 1) {
    court = rotateClockwise(court);
  }
  return court;
}

export function findPlayerZone(
  court: CourtAssignment,
  playerId: string,
): CourtZone | null {
  for (const zone of [1, 2, 3, 4, 5, 6] as CourtZone[]) {
    if (court[zone] === playerId) return zone;
  }
  return null;
}

export function swapZones(
  court: CourtAssignment,
  a: CourtZone,
  b: CourtZone,
): CourtAssignment {
  const next = cloneCourt(court);
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return next;
}

export function assignZone(
  court: CourtAssignment,
  zone: CourtZone,
  playerId: string | null,
): CourtAssignment {
  const next = cloneCourt(court);
  // If player already on court elsewhere, clear that slot first
  if (playerId) {
    for (const z of [1, 2, 3, 4, 5, 6] as CourtZone[]) {
      if (next[z] === playerId) next[z] = null;
    }
  }
  next[zone] = playerId;
  return next;
}

export function occupiedPlayerIds(court: CourtAssignment): string[] {
  return ([1, 2, 3, 4, 5, 6] as CourtZone[])
    .map((z) => court[z])
    .filter((id): id is string => id !== null);
}

export function rotationLabel(index: number): string {
  const n = ((index % 6) + 6) % 6;
  return `R${n + 1}`;
}

export function isBackRow(zone: CourtZone): boolean {
  return zone === 1 || zone === 5 || zone === 6;
}

export function isFrontRow(zone: CourtZone): boolean {
  return zone === 2 || zone === 3 || zone === 4;
}
