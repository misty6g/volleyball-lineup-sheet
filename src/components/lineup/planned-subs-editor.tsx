"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPlannedSub,
  SUB_ROTATION_OPTIONS,
} from "@/domain/planned-subs";
import { occupiedPlayerIds, rotationLabel } from "@/domain/rotation";
import type {
  CourtAssignment,
  PlannedSub,
  Player,
} from "@/domain/types";

interface PlannedSubsEditorProps {
  plannedSubs: PlannedSub[];
  onChange: (next: PlannedSub[]) => void;
  startingCourt: CourtAssignment;
  players: Player[];
}

export function PlannedSubsEditor({
  plannedSubs,
  onChange,
  startingCourt,
  players,
}: PlannedSubsEditorProps) {
  const starters = occupiedPlayerIds(startingCourt)
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p));

  const starterIds = new Set(starters.map((p) => p.id));
  const bench = players.filter(
    (p) => p.isActive && !starterIds.has(p.id),
  );

  const update = (id: string, patch: Partial<PlannedSub>) => {
    onChange(
      plannedSubs.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  return (
    <section
      className="space-y-3 rounded-2xl border border-white/10 bg-card/60 p-3"
      data-testid="planned-subs"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-rit">Planned subs</h2>
          <p className="text-xs text-muted-foreground">
            Auto-apply when Rotate reaches that rotation (after N side-outs
            from start). Outgoing player is replaced in their zone — order
            stays legal.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          data-testid="add-planned-sub"
          onClick={() =>
            onChange([...plannedSubs, createPlannedSub({ atRotationIndex: 1 })])
          }
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {plannedSubs.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No planned subs. Example: at R2, bring Reid in for Devon.
        </p>
      ) : (
        <ul className="space-y-3">
          {plannedSubs.map((sub) => (
            <li
              key={sub.id}
              className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-2.5"
              data-testid={`planned-sub-${sub.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground">When</Label>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="text-destructive"
                  aria-label="Remove planned sub"
                  onClick={() =>
                    onChange(plannedSubs.filter((s) => s.id !== sub.id))
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <Select
                value={String(sub.atRotationIndex)}
                onValueChange={(v) =>
                  update(sub.id, { atRotationIndex: Number(v) })
                }
              >
                <SelectTrigger data-testid={`planned-sub-when-${sub.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUB_ROTATION_OPTIONS.map((idx) => (
                    <SelectItem key={idx} value={String(idx)}>
                      {rotationLabel(idx)} · after {idx} rotate
                      {idx === 1 ? "" : "s"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Out (starter)</Label>
                  <Select
                    value={sub.outPlayerId || "none"}
                    onValueChange={(v) =>
                      update(sub.id, {
                        outPlayerId: v === "none" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger data-testid={`planned-sub-out-${sub.id}`}>
                      <SelectValue placeholder="Out" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select…</SelectItem>
                      {starters.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ""}
                          {p.name.split(" ").slice(-1)[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">In (bench)</Label>
                  <Select
                    value={sub.inPlayerId || "none"}
                    onValueChange={(v) =>
                      update(sub.id, {
                        inPlayerId: v === "none" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger data-testid={`planned-sub-in-${sub.id}`}>
                      <SelectValue placeholder="In" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select…</SelectItem>
                      {bench.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ""}
                          {p.name.split(" ").slice(-1)[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
