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
import { plannedSubSummary } from "@/domain/planned-subs";
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
  const lastAppliedSubs = useMatchStore((s) => s.lastAppliedSubs);

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

  const upcomingSubs = useMemo(() => {
    if (!session) return [];
    const next = (session.rotationIndex + 1) % 6;
    return (session.plannedSubs ?? []).filter(
      (s) =>
        s.atRotationIndex === next && s.inPlayerId && s.outPlayerId,
    );
  }, [session]);

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
    const from = session.rotationIndex;
    await rotate();
    if (settings.hapticFeedback && navigator.vibrate) navigator.vibrate(12);
    const applied = useMatchStore.getState().lastAppliedSubs;
    const nextLabel = rotationLabel((from + 1) % 6);
    if (applied.length > 0) {
      toast.success(
        `${nextLabel} · ${applied
          .map((s) => plannedSubSummary(s, playersById))
          .join("; ")}`,
      );
    } else {
      toast.message(`Now ${nextLabel}`);
    }
  };

  return (
    <main
      className="flex flex-1 flex-col px-4 pb-44 pt-5 landscape:h-dvh landscape:max-h-dvh landscape:overflow-hidden landscape:px-3 landscape:pb-28 landscape:pt-2"
      data-testid="match-page"
    >
      <header className="mb-3 flex items-start justify-between gap-2 landscape:mb-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-rit uppercase">
            Match Mode
          </p>
          <h1 className="text-xl font-semibold tracking-tight landscape:text-lg">
            {session.lineupName}
          </h1>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge
              className="bg-rit text-black hover:bg-rit"
              data-testid="match-rotation"
            >
              {rotationLabel(session.rotationIndex)}
            </Badge>
            <Badge variant="outline">{session.system}</Badge>
            {session.liberoOnCourt && (
              <Badge variant="secondary">Libero on</Badge>
            )}
            {(session.plannedSubs?.length ?? 0) > 0 && (
              <Badge variant="outline">
                {session.plannedSubs!.length} planned
              </Badge>
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

      <div className="landscape:grid landscape:min-h-0 landscape:flex-1 landscape:grid-cols-[minmax(0,1.2fr)_minmax(14rem,0.8fr)] landscape:gap-3">
        <CourtDiagram
          court={session.court}
          playersById={playersById}
          selectedZone={selectedZone}
          onSelectZone={(z) => {
            setSelectedZone(z);
            setSubOpen(true);
          }}
          showJersey={settings.showJerseyNumbers}
          className="mb-3 landscape:mb-0 landscape:min-h-0 landscape:h-full"
        />

        <div className="space-y-3 landscape:min-h-0 landscape:overflow-y-auto landscape:pr-1">
          <div className="grid grid-cols-2 gap-2 landscape:grid-cols-1">
            <Button
              variant="outline"
              className="h-11 landscape:h-10"
              disabled={
                !libero ||
                session.liberoOnCourt ||
                !selectedZone ||
                !isBackRow(selectedZone)
              }
              onClick={() => {
                if (!selectedZone) {
                  toast.message("Select a back-row zone first");
                  return;
                }
                void liberoIn(selectedZone).then(() =>
                  toast.success("Libero in"),
                );
              }}
              data-testid="libero-in"
            >
              <UserRound className="size-4" />
              Libero in
            </Button>
            <Button
              variant="outline"
              className="h-11 landscape:h-10"
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
            <p className="text-xs text-muted-foreground">
              Libero: {libero.name}
              {session.liberoOnCourt
                ? " · on court"
                : " · tap a back-row zone, then Libero in"}
            </p>
          )}

          {upcomingSubs.length > 0 && (
            <div
              className="rounded-xl border border-rit/25 bg-rit/10 px-3 py-2 text-xs"
              data-testid="upcoming-planned-subs"
            >
              <p className="mb-1 font-medium text-rit">
                Next rotate → {rotationLabel(session.rotationIndex + 1)}
              </p>
              <ul className="space-y-0.5 text-muted-foreground">
                {upcomingSubs.map((s) => (
                  <li key={s.id}>{plannedSubSummary(s, playersById)}</li>
                ))}
              </ul>
            </div>
          )}

          {lastAppliedSubs.length > 0 && (
            <p className="text-xs text-emerald-300/90">
              Last rotate applied{" "}
              {lastAppliedSubs
                .map((s) => plannedSubSummary(s, playersById))
                .join("; ")}
            </p>
          )}

          <div className="hidden landscape:block">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              Bench · tap a zone to sub
            </h2>
            <ul className="space-y-1.5">
              {bench.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <PlayerChip player={p} compact showJersey={settings.showJerseyNumbers} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

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
              Quick sub{selectedZone ? ` · Zone ${selectedZone}` : ""}
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
                        toast.success(`${p.name} in`);
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
