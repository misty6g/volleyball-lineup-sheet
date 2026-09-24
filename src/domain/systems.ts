import { assignZone, occupiedPlayerIds } from "./rotation";
import {
  emptyCourt,
  type CourtAssignment,
  type CourtZone,
  type LineupSystem,
  type Player,
  type PositionCode,
} from "./types";

function canPlay(player: Player, code: PositionCode): boolean {
  return (
    player.primaryPosition === code ||
    player.secondaryPositions.includes(code)
  );
}

function pick(
  pool: Player[],
  code: PositionCode,
  used: Set<string>,
): Player | undefined {
  const primary = pool.find(
    (p) => p.isActive && !used.has(p.id) && p.primaryPosition === code,
  );
  if (primary) return primary;
  return pool.find(
    (p) => p.isActive && !used.has(p.id) && canPlay(p, code),
  );
}

/**
 * Autofill a starting six for the chosen system.
 * 5-1 target shape (serve-receive R1, setter in zone 1):
 *   Front 4=OH, 3=MB, 2=RS | Back 5=OH, 6=MB, 1=S
 * 6-2 target shape (setters opposite):
 *   Front 4=OH, 3=MB, 2=S  | Back 5=OH, 6=MB, 1=S  (second setter back-row sets)
 */
export function autofillCourt(
  players: Player[],
  system: LineupSystem,
): CourtAssignment {
  const used = new Set<string>();
  let court = emptyCourt();

  const targets: Partial<Record<CourtZone, PositionCode>> =
    system === "6-2"
      ? { 1: "S", 2: "S", 3: "MB", 4: "OH", 5: "OH", 6: "MB" }
      : { 1: "S", 2: "RS", 3: "MB", 4: "OH", 5: "OH", 6: "MB" };

  for (const zone of [1, 2, 3, 4, 5, 6] as CourtZone[]) {
    const code = targets[zone];
    if (!code) continue;
    const player = pick(players, code, used);
    if (player) {
      used.add(player.id);
      court = assignZone(court, zone, player.id);
    }
  }

  // Fill any remaining empty zones with unused active non-libero players
  const leftovers = players.filter(
    (p) =>
      p.isActive &&
      !used.has(p.id) &&
      p.primaryPosition !== "L",
  );
  for (const zone of [1, 2, 3, 4, 5, 6] as CourtZone[]) {
    if (court[zone]) continue;
    const next = leftovers.shift();
    if (!next) break;
    used.add(next.id);
    court = assignZone(court, zone, next.id);
  }

  return court;
}

export function suggestLibero(players: Player[]): string | null {
  const libero = players.find(
    (p) => p.isActive && p.primaryPosition === "L",
  );
  return libero?.id ?? null;
}

export function availableBench(
  players: Player[],
  court: CourtAssignment,
  liberoId: string | null,
): Player[] {
  const onCourt = new Set(occupiedPlayerIds(court));
  return players.filter(
    (p) =>
      p.isActive &&
      !onCourt.has(p.id) &&
      p.id !== liberoId,
  );
}
