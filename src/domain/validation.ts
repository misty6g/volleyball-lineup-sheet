import { isBackRow, occupiedPlayerIds } from "./rotation";
import type {
  CourtAssignment,
  CourtZone,
  LineupSystem,
  Player,
  PositionCode,
  ValidationIssue,
} from "./types";

function playerById(
  players: Player[],
  id: string | null,
): Player | undefined {
  if (!id) return undefined;
  return players.find((p) => p.id === id);
}

function positionsOf(player: Player): PositionCode[] {
  return [player.primaryPosition, ...player.secondaryPositions];
}

function canPlay(player: Player, code: PositionCode): boolean {
  return positionsOf(player).includes(code);
}

export function validateLineup(
  court: CourtAssignment,
  players: Player[],
  system: LineupSystem,
  liberoId: string | null,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = occupiedPlayerIds(court);

  if (ids.length < 6) {
    issues.push({
      code: "incomplete_court",
      severity: "warning",
      message: `Court has ${ids.length}/6 players assigned`,
    });
  }

  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    issues.push({
      code: "duplicate_player",
      severity: "warning",
      message: "A player appears in more than one zone",
    });
  }

  if (liberoId && ids.includes(liberoId)) {
    issues.push({
      code: "libero_on_starting_six",
      severity: "info",
      message: "Libero is listed in the starting six — usually they start off-court",
    });
  }

  const onCourt = ids
    .map((id) => playerById(players, id))
    .filter((p): p is Player => Boolean(p));

  const setters = onCourt.filter((p) => canPlay(p, "S"));

  if (system === "5-1") {
    if (setters.length === 0) {
      issues.push({
        code: "51_no_setter",
        severity: "warning",
        message: "5-1 expects one setter on the court",
      });
    } else if (setters.length > 1) {
      issues.push({
        code: "51_multi_setter",
        severity: "info",
        message: `5-1 typically has one setter; found ${setters.length}`,
      });
    }
  }

  if (system === "6-2") {
    if (setters.length < 2) {
      issues.push({
        code: "62_need_two_setters",
        severity: "warning",
        message: "6-2 expects two setters (or setting specialists) on the court",
      });
    }
  }

  for (const zone of [2, 3, 4] as CourtZone[]) {
    const p = playerById(players, court[zone]);
    if (p && p.primaryPosition === "L") {
      issues.push({
        code: "libero_front_row",
        severity: "warning",
        message: `${p.name} (libero) is in front-row zone ${zone}`,
        zone,
        playerId: p.id,
      });
    }
  }

  return issues;
}

export function validateLiberoSwap(
  court: CourtAssignment,
  players: Player[],
  liberoId: string,
  targetZone: CourtZone,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isBackRow(targetZone)) {
    issues.push({
      code: "libero_front_swap",
      severity: "warning",
      message: "Libero may only replace a back-row player",
      zone: targetZone,
    });
  }
  const target = players.find((p) => p.id === court[targetZone]);
  if (target && target.primaryPosition === "S") {
    issues.push({
      code: "libero_replace_setter",
      severity: "info",
      message: "Replacing the setter with libero — confirm intentional",
      zone: targetZone,
      playerId: target.id,
    });
  }
  void players;
  void liberoId;
  return issues;
}
