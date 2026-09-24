"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, UserRound } from "lucide-react";
import { toast } from "sonner";
import { CourtDiagram } from "@/components/court/court-diagram";
import { StickyActionBar } from "@/components/layout/sticky-action-bar";
import { PlayerChip } from "@/components/players/player-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { isBackRow, rotationLabel } from "@/domain/rotation";
import type { CourtZone } from "@/domain/types";
import { useAppStore } from "@/store/app-store";
import { useMatchStore } from "@/store/match-store";

export default function MatchPage() {
  const router = useRouter();
  const players = useAppStore((s) => s.players);
  const settings = useAppStore((s) => s.settings);
  const session = useMatchStore((s) => s.session);
  const loadActive = useMatchStore((s) => s.loadActive);
  const rotate = useMatchStore((s) => s.rotate);
  const undo = useMatchStore((s) => s.undo);
  const canUndo = useMatchStore((s) => s.canUndo);
  const quickSub = useMatchStore((s) => s.quickSub);
  const liberoIn = useMatchStore((s) => s.liberoIn);
  const liberoOut = useMatchStore((s) => s.liberoOut);
  const endMatch = useMatchStore((s) => s.endMatch);
  const error = useMatchStore((s) => s.error);

  const [selectedZone, setSelectedZone] = useState<CourtZone | null>(null);
  const [subOpen, setSubOpen] = useState(false);

  useEffect(() => {
    void loadActive();
  }, [loadActive]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players],
  );

  const bench = useMemo(() => {
    if (!session) return [];
    const onCourt = new Set(
      Object.values(session.court).filter((id): id is string => Boolean(id)),
    );
    return players.filter((p) => p.isActive && !onCourt.has(p.id));
  }, [players, session]);

  const libero = session?.liberoId
    ? playersById[session.liberoId]
    : undefined;

  if (!session) {
    return (
      <main
        className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-28 text-center"
        data-testid="match-empty"
      >
        <h1 className="text-xl font-semibold">No active match</h1>
        <p className="text-sm text-muted-foreground">
          Start Match Mode from a saved lineup or the lineup builder.
        </p>
        <Button onClick={() => router.push("/lineups")}>Browse lineups</Button>
      </main>
    );
  }

  const doRotate = async () => {
    if (settings.confirmRotate) {
      const ok = window.confirm("Rotate clockwise (side-out)?");
      if (!ok) return;
    }
    await rotate();
    if (settings.hapticFeedback && navigator.vibrate) navigator.vibrate(12);
    toast.message("Now " + (rotationLabel(session.rotationIndex + 1)));
  };

  return (
    <main
      className="flex flex-1 flex-col px-4 pb-44 pt-5"
      data-testid="match-page"
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-rit uppercase">
            Match Mode
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            {session.lineupName}
          </h1>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge className="bg-rit text-black hover:bg-rit">
              {rotationLabel(session.rotationIndex)}
            </Badge>
            <Badge variant="outline">{session.system}</Badge>
            {session.liberoOnCourt && (
              <Badge variant="secondary">Libero on</Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void endMatch().then(() => {
              toast.message("Match ended");
              router.push("/lineups");
            });
          }}
        >
          End
        </Button>
      </header>

      <CourtDiagram
        court={session.court}
        playersById={playersById}
        selectedZone={selectedZone}
        onSelectZone={(z) => {
          setSelectedZone(z);
          setSubOpen(true);
        }}
        showJersey={settings.showJerseyNumbers}
        className="mb-3"
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-11"
          disabled={!libero || session.liberoOnCourt || !selectedZone || !isBackRow(selectedZone)}
          onClick={() => {
            if (!selectedZone) {
              toast.message("Select a back-row zone first");
              return;
            }
            void liberoIn(selectedZone).then(() => toast.success("Libero in"));
          }}
          data-testid="libero-in"
        >
          <UserRound className="size-4" />
          Libero in
        </Button>
        <Button
          variant="outline"
          className="h-11"
          disabled={!session.liberoOnCourt}
          onClick={() => {
            void liberoOut().then(() => toast.success("Libero out"));
          }}
          data-testid="libero-out"
        >
          <ArrowLeftRight className="size-4" />
          Libero out
        </Button>
      </div>

      {libero && (
        <p className="mb-3 text-xs text-muted-foreground">
          Libero: {libero.name}
          {session.liberoOnCourt
            ? " · on court"
            : " · tap a back-row zone, then Libero in"}
        </p>
      )}

      <StickyActionBar
        canUndo={canUndo()}
        onUndo={() => void undo()}
        onRotate={() => void doRotate()}
        rotateLabel={`Rotate → ${rotationLabel(session.rotationIndex + 1)}`}
        matchLabel="Lineups"
        onMatchMode={() => router.push("/lineups")}
      />

      <Sheet open={subOpen} onOpenChange={setSubOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Quick sub{selectedZone ? " · Zone " + (selectedZone) : ""}
            </SheetTitle>
          </SheetHeader>
          <ul className="mt-3 space-y-2 pb-6">
            {bench.length === 0 ? (
              <li className="text-sm text-muted-foreground">No bench players.</li>
            ) : (
              bench.map((p) => (
                <li key={p.id}>
                  <PlayerChip
                    player={p}
                    showJersey={settings.showJerseyNumbers}
                    onClick={() => {
                      if (!selectedZone) return;
                      void quickSub(selectedZone, p.id).then(() => {
                        toast.success((p.name) + " in");
                        setSubOpen(false);
                      });
                    }}
                  />
                </li>
              ))
            )}
          </ul>
        </SheetContent>
      </Sheet>
    </main>
  );
}
