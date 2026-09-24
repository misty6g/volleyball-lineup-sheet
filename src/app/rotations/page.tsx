"use client";

import { useMemo, useState } from "react";
import { CourtDiagram } from "@/components/court/court-diagram";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { courtAtRotation, rotationLabel } from "@/domain/rotation";
import { useAppStore } from "@/store/app-store";

export default function RotationsPage() {
  const lineups = useAppStore((s) => s.lineups);
  const players = useAppStore((s) => s.players);
  const [lineupId, setLineupId] = useState<string>("");

  const selected =
    lineups.find((l) => l.id === lineupId) ?? lineups[0] ?? null;

  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players],
  );

  return (
    <main className="flex flex-1 flex-col px-4 pb-28 pt-6" data-testid="rotations-page">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Rotation overview
        </h1>
        <p className="text-sm text-muted-foreground">
          All six rotations from a starting serve-receive.
        </p>
      </header>

      {lineups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">
          Save a lineup first to preview rotations.
        </div>
      ) : (
        <>
          <Select
            value={selected?.id}
            onValueChange={setLineupId}
          >
            <SelectTrigger className="mb-4" data-testid="rotation-lineup-select">
              <SelectValue placeholder="Choose lineup" />
            </SelectTrigger>
            <SelectContent>
              {lineups.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selected && (
            <div className="space-y-5">
              {Array.from({ length: 6 }, (_, i) => {
                const court = courtAtRotation(selected.court, i);
                return (
                  <section key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-rit text-black">{rotationLabel(i)}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {i === 0 ? "Starting SR" : `${i} side-out${i > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <CourtDiagram
                      court={court}
                      playersById={playersById}
                      compact
                    />
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
