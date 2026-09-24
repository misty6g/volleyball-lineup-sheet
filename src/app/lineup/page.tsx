"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CourtDiagram } from "@/components/court/court-diagram";
import { StickyActionBar } from "@/components/layout/sticky-action-bar";
import { PlayerChip } from "@/components/players/player-chip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { autofillCourt, suggestLibero } from "@/domain/systems";
import { assignZone, cloneCourt, occupiedPlayerIds } from "@/domain/rotation";
import { validateLineup } from "@/domain/validation";
import {
  emptyCourt,
  type CourtAssignment,
  type CourtZone,
  type Lineup,
  type LineupSystem,
} from "@/domain/types";
import { useAppStore } from "@/store/app-store";
import { useMatchStore } from "@/store/match-store";
import { Suspense } from "react";

function LineupBuilderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const players = useAppStore((s) => s.players);
  const lineups = useAppStore((s) => s.lineups);
  const upsertLineup = useAppStore((s) => s.upsertLineup);
  const startFromLineup = useMatchStore((s) => s.startFromLineup);

  const [name, setName] = useState("New lineup");
  const [system, setSystem] = useState<LineupSystem>("5-1");
  const [court, setCourt] = useState<CourtAssignment>(emptyCourt());
  const [liberoId, setLiberoId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [selectedZone, setSelectedZone] = useState<CourtZone | null>(null);
  const [lineupId, setLineupId] = useState<string | null>(null);
  const [history, setHistory] = useState<CourtAssignment[]>([]);

  useEffect(() => {
    if (!editId) return;
    const existing = lineups.find((l) => l.id === editId);
    if (!existing) return;
    setLineupId(existing.id);
    setName(existing.name);
    setSystem(existing.system);
    setCourt(cloneCourt(existing.court));
    setLiberoId(existing.liberoId);
    setNotes(existing.notes);
  }, [editId, lineups]);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players],
  );

  const issues = useMemo(
    () => validateLineup(court, players, system, liberoId),
    [court, players, system, liberoId],
  );

  const bench = useMemo(() => {
    const used = new Set(occupiedPlayerIds(court));
    if (liberoId) used.add(liberoId);
    return players.filter((p) => p.isActive && !used.has(p.id));
  }, [players, court, liberoId]);

  const liberios = players.filter(
    (p) => p.isActive && (p.primaryPosition === "L" || p.secondaryPositions.includes("L")),
  );

  const pushUndo = (prev: CourtAssignment) => {
    setHistory((h) => [...h, cloneCourt(prev)].slice(-40));
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const next = [...h];
      const prev = next.pop()!;
      setCourt(prev);
      return next;
    });
  };

  const onSelectZone = (zone: CourtZone) => {
    setSelectedZone((z) => (z === zone ? null : zone));
  };

  const assignPlayer = (playerId: string) => {
    if (!selectedZone) {
      toast.message("Tap a court zone first");
      return;
    }
    pushUndo(court);
    setCourt(assignZone(court, selectedZone, playerId));
  };

  const clearZone = () => {
    if (!selectedZone) return;
    pushUndo(court);
    setCourt(assignZone(court, selectedZone, null));
  };

  const autofill = () => {
    pushUndo(court);
    const filled = autofillCourt(players, system);
    setCourt(filled);
    if (!liberoId) setLiberoId(suggestLibero(players));
    toast.success("Autofilled from roster");
  };

  const save = async (): Promise<Lineup> => {
    const now = Date.now();
    const lineup: Lineup = {
      id: lineupId ?? crypto.randomUUID(),
      name: name.trim() || "Untitled lineup",
      system,
      court: cloneCourt(court),
      liberoId,
      notes,
      createdAt: lineupId
        ? (lineups.find((l) => l.id === lineupId)?.createdAt ?? now)
        : now,
      updatedAt: now,
    };
    await upsertLineup(lineup);
    setLineupId(lineup.id);
    toast.success("Lineup saved");
    return lineup;
  };

  return (
    <main
      className="flex flex-1 flex-col px-4 pb-44 pt-6"
      data-testid="lineup-builder"
    >
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Lineup builder</h1>
        <p className="text-sm text-muted-foreground">
          Front 4-3-2 · Back 5-6-1 · Zone 1 serves
        </p>
      </header>

      <div className="mb-3 space-y-3 rounded-2xl border border-white/10 bg-card/60 p-3">
        <div className="space-y-1.5">
          <Label htmlFor="lu-name">Name</Label>
          <Input
            id="lu-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="lineup-name"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>System</Label>
            <Select
              value={system}
              onValueChange={(v) => setSystem(v as LineupSystem)}
            >
              <SelectTrigger data-testid="lineup-system">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5-1">5-1</SelectItem>
                <SelectItem value="6-2">6-2</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Libero</Label>
            <Select
              value={liberoId ?? "none"}
              onValueChange={(v) => setLiberoId(v === "none" ? null : v)}
            >
              <SelectTrigger data-testid="lineup-libero">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {liberios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={autofill}
          data-testid="autofill"
        >
          <Sparkles className="size-4" />
          Autofill starting six
        </Button>
      </div>

      <CourtDiagram
        court={court}
        playersById={playersById}
        selectedZone={selectedZone}
        onSelectZone={onSelectZone}
        className="mb-3"
      />

      {selectedZone && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-rit/30 bg-rit/10 px-3 py-2 text-sm">
          <span>
            Assigning <strong>Zone {selectedZone}</strong>
          </span>
          <Button size="sm" variant="ghost" onClick={clearZone}>
            Clear
          </Button>
        </div>
      )}

      {issues.length > 0 && (
        <Alert className="mb-3 border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="size-4 text-amber-400" />
          <AlertTitle className="text-amber-200">Validation (non-blocking)</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-100/90">
              {issues.map((i) => (
                <li key={i.code + i.message}>{i.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        Bench ({bench.length})
      </h2>
      <ul className="mb-4 space-y-2">
        {bench.length === 0 ? (
          <li className="text-sm text-muted-foreground">All active players assigned.</li>
        ) : (
          bench.map((p) => (
            <li key={p.id}>
              <PlayerChip player={p} onClick={() => assignPlayer(p.id)} />
            </li>
          ))
        )}
      </ul>

      <div className="mb-3 space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
        />
      </div>

      <Button
        className="mb-2 h-11 w-full bg-rit text-black hover:bg-rit/90"
        onClick={() => void save()}
        data-testid="save-lineup"
      >
        Save lineup
      </Button>

      <StickyActionBar
        canUndo={history.length > 0}
        onUndo={undo}
        onRotate={() => {
          toast.message("Open Match Mode to rotate live");
        }}
        rotateLabel="Rotate"
        matchLabel="Match"
        onMatchMode={() => {
          void save().then((lu) =>
            startFromLineup(lu).then(() => router.push("/match")),
          );
        }}
      />
    </main>
  );
}

export default function LineupBuilderPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          Loading builder…
        </main>
      }
    >
      <LineupBuilderInner />
    </Suspense>
  );
}
