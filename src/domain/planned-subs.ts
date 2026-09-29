import {
  assignZone,
  findPlayerZone,
  occupiedPlayerIds,
} from "@/domain/rotation";
import type {
  CourtAssignment,
  PlannedSub,
  Player,
  ValidationIssue,
} from "@/domain/types";

/** Rotation indices where a planned sub can fire (R2–R6). R1 is the start. */
export const SUB_ROTATION_OPTIONS = [1, 2, 3, 4, 5] as const;

export function createPlannedSub(partial?: Partial<PlannedSub>): PlannedSub {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    atRotationIndex: partial?.atRotationIndex ?? 1,
    inPlayerId: partial?.inPlayerId ?? "",
    outPlayerId: partial?.outPlayerId ?? "",
  };
}

export function validatePlannedSubs(
  plannedSubs: PlannedSub[],
  startingCourt: CourtAssignment,
  players: Player[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const startingIds = new Set(occupiedPlayerIds(startingCourt));
  const playerIds = new Set(players.map((p) => p.id));

  for (const sub of plannedSubs) {
    if (!sub.inPlayerId || !sub.outPlayerId) {
      issues.push({
        code: "planned_sub_incomplete",
        severity: "warning",
        message: `Planned sub at R${sub.atRotationIndex + 1} is incomplete (need in + out)`,
      });
      continue;
    }

    if (sub.inPlayerId === sub.outPlayerId) {
      issues.push({
        code: "planned_sub_same_player",
        severity: "warning",
        message: "A planned sub cannot use the same player in and out",
        playerId: sub.inPlayerId,
      });
    }

    if (!playerIds.has(sub.inPlayerId) || !playerIds.has(sub.outPlayerId)) {
      issues.push({
        code: "planned_sub_unknown_player",
        severity: "warning",
        message: "Planned sub references a player not on the roster",
      });
    }

    if (!startingIds.has(sub.outPlayerId)) {
      const name =
        players.find((p) => p.id === sub.outPlayerId)?.name ?? "Outgoing player";
      issues.push({
        code: "planned_sub_out_not_starting",
        severity: "warning",
        message: `${name} is not in the starting six — sub may not apply`,
        playerId: sub.outPlayerId,
      });
    }

    if (startingIds.has(sub.inPlayerId)) {
      const name =
        players.find((p) => p.id === sub.inPlayerId)?.name ?? "Incoming player";
      issues.push({
        code: "planned_sub_in_is_starting",
        severity: "info",
        message: `${name} starts on court — plan assumes they are benched by then`,
        playerId: sub.inPlayerId,
      });
    }
  }

  // Conflicts: multiple outs targeting same player at same rotation
  const byRot = new Map<number, PlannedSub[]>();
  for (const sub of plannedSubs) {
    const list = byRot.get(sub.atRotationIndex) ?? [];
    list.push(sub);
    byRot.set(sub.atRotationIndex, list);
  }
  for (const [rot, list] of byRot) {
    const outs = list.map((s) => s.outPlayerId).filter(Boolean);
    const ins = list.map((s) => s.inPlayerId).filter(Boolean);
    if (new Set(outs).size !== outs.length) {
      issues.push({
        code: "planned_sub_duplicate_out",
        severity: "warning",
        message: `Multiple planned outs for the same player at R${rot + 1}`,
      });
    }
    if (new Set(ins).size !== ins.length) {
      issues.push({
        code: "planned_sub_duplicate_in",
        severity: "warning",
        message: `Same player planned in twice at R${rot + 1}`,
      });
    }
  }

  return issues;
}

export interface ApplyPlannedSubsResult {
  court: CourtAssignment;
  applied: PlannedSub[];
  skipped: Array<{ sub: PlannedSub; reason: string }>;
}

/**
 * Apply planned substitutions for a target rotation index.
 * Finds each outgoing player on the (already rotated) court and replaces
 * them with the incoming player — preserving zone / rotational order.
 */
export function applyPlannedSubsForRotation(
  court: CourtAssignment,
  plannedSubs: PlannedSub[],
  atRotationIndex: number,
): ApplyPlannedSubsResult {
  const applicable = plannedSubs.filter(
    (s) =>
      s.atRotationIndex === atRotationIndex &&
      s.inPlayerId &&
      s.outPlayerId &&
      s.inPlayerId !== s.outPlayerId,
  );

  let next = court;
  const applied: PlannedSub[] = [];
  const skipped: ApplyPlannedSubsResult["skipped"] = [];
  const usedIncoming = new Set<string>();

  for (const sub of applicable) {
    const zone = findPlayerZone(next, sub.outPlayerId);
    if (zone === null) {
      skipped.push({
        sub,
        reason: "Outgoing player is not on court",
      });
      continue;
    }
    if (occupiedPlayerIds(next).includes(sub.inPlayerId)) {
      skipped.push({
        sub,
        reason: "Incoming player is already on court",
      });
      continue;
    }
    if (usedIncoming.has(sub.inPlayerId)) {
      skipped.push({
        sub,
        reason: "Incoming player already used in this rotation",
      });
      continue;
    }
    next = assignZone(next, zone, sub.inPlayerId);
    usedIncoming.add(sub.inPlayerId);
    applied.push(sub);
  }

  return { court: next, applied, skipped };
}

export function plannedSubSummary(
  sub: PlannedSub,
  playersById: Record<string, Player>,
): string {
  const inn = playersById[sub.inPlayerId]?.name.split(" ").slice(-1)[0] ?? "?";
  const out =
    playersById[sub.outPlayerId]?.name.split(" ").slice(-1)[0] ?? "?";
  return `R${sub.atRotationIndex + 1}: ${inn} in for ${out}`;
}
