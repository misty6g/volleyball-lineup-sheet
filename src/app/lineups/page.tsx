"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CourtDiagram } from "@/components/court/court-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { useMatchStore } from "@/store/match-store";
import { useMemo } from "react";

export default function LineupsPage() {
  const router = useRouter();
  const team = useAppStore((s) => s.team);
  const lineups = useAppStore((s) => s.lineups);
  const players = useAppStore((s) => s.players);
  const deleteLineup = useAppStore((s) => s.deleteLineup);
  const startFromLineup = useMatchStore((s) => s.startFromLineup);
  const hydrated = useAppStore((s) => s.hydrated);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players],
  );

  if (!hydrated) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-4 pb-28 pt-6" data-testid="lineups-page">
      <header className="mb-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-rit uppercase">
          Rotation Board
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {team?.name ?? "Saved lineups"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a lineup to edit or jump into Match Mode.
        </p>
      </header>

      <Button asChild className="mb-4 h-11 bg-rit text-black hover:bg-rit/90">
        <Link href="/lineup" data-testid="new-lineup">
          <Plus className="size-4" />
          New lineup
        </Link>
      </Button>

      {lineups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">
          No saved lineups yet. Build one from the roster or reload the demo team
          in Settings.
        </div>
      ) : (
        <ul className="space-y-4">
          {lineups.map((lu) => (
            <li
              key={lu.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-card/70"
              data-testid={`lineup-card-${lu.id}`}
            >
              <div className="flex items-start justify-between gap-2 px-3 pt-3">
                <div>
                  <h2 className="font-semibold text-white">{lu.name}</h2>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{lu.system}</Badge>
                    {lu.liberoId && playersById[lu.liberoId] && (
                      <Badge variant="secondary">
                        L · {playersById[lu.liberoId]!.name.split(" ").slice(-1)}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => {
                    void deleteLineup(lu.id).then(() =>
                      toast.success("Lineup deleted"),
                    );
                  }}
                  aria-label={`Delete ${lu.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="p-3 pt-2">
                <CourtDiagram
                  court={lu.court}
                  playersById={playersById}
                  compact
                  onSelectZone={() => router.push(`/lineup?id=${lu.id}`)}
                />
              </div>
              <div className="flex gap-2 border-t border-white/10 p-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/lineup?id=${lu.id}`)}
                >
                  Edit
                </Button>
                <Button
                  className="flex-1 bg-rit text-black hover:bg-rit/90"
                  onClick={() => {
                    void startFromLineup(lu).then(() => {
                      toast.success("Match started");
                      router.push("/match");
                    });
                  }}
                  data-testid={`start-match-${lu.id}`}
                >
                  <Play className="size-4" />
                  Match
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
