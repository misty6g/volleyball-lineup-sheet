"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PlayerChip } from "@/components/players/player-chip";
import { PlayerForm } from "@/components/players/player-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Player } from "@/domain/types";
import { exportRosterCsv, parseRosterCsv } from "@/lib/csv";
import { useAppStore } from "@/store/app-store";

export default function RosterPage() {
  const players = useAppStore((s) => s.players);
  const upsertPlayer = useAppStore((s) => s.upsertPlayer);
  const deletePlayer = useAppStore((s) => s.deletePlayer);
  const replacePlayers = useAppStore((s) => s.replacePlayers);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);

  const sorted = useMemo(
    () =>
      [...players].sort((a, b) =>
        a.primaryPosition === b.primaryPosition
          ? a.name.localeCompare(b.name)
          : a.primaryPosition.localeCompare(b.primaryPosition),
      ),
    [players],
  );

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (p: Player) => {
    setEditing(p);
    setOpen(true);
  };

  const onImport = async (file: File) => {
    const text = await file.text();
    const { players: rows, errors } = parseRosterCsv(text);
    if (rows.length === 0) {
      toast.error(errors[0] ?? "No players found");
      return;
    }
    const now = Date.now();
    const next: Player[] = rows.map((r) => {
      const player: Player = {
        id: crypto.randomUUID(),
        name: r.name,
        jerseyNumber: r.jerseyNumber,
        primaryPosition: r.primaryPosition,
        secondaryPositions: r.secondaryPositions,
        isActive: r.isActive,
        createdAt: now,
        updatedAt: now,
      };
      return player;
    });
    await replacePlayers([...players, ...next]);
    toast.success("Imported " + next.length + " players");
    if (errors.length) toast.message(errors.length + " row warning(s)");
  };

  const onExport = () => {
    const csv = exportRosterCsv(players);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roster.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex flex-1 flex-col px-4 pb-28 pt-6" data-testid="roster-page">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roster</h1>
          <p className="text-sm text-muted-foreground">
            {players.length} players · CSV Name, Position, Secondary
          </p>
        </div>
        <Button size="sm" onClick={openCreate} data-testid="add-player">
          <Plus className="size-4" />
          Add
        </Button>
      </header>

      <div className="mb-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => fileRef.current?.click()}
          data-testid="import-csv"
        >
          <Upload className="size-4" />
          Import CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onExport}
          disabled={players.length === 0}
        >
          <Download className="size-4" />
          Export
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = "";
          }}
        />
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">
          No players yet. Add athletes or import a CSV with Name, Position,
          Secondary columns.
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <PlayerChip
                player={p}
                className="flex-1"
                onClick={() => openEdit(p)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive"
                onClick={() => {
                  void deletePlayer(p.id).then(() =>
                    toast.success("Player removed"),
                  );
                }}
                aria-label={"Delete " + p.name}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit player" : "Add player"}</DialogTitle>
          </DialogHeader>
          {open && (
            <PlayerForm
              key={editing?.id ?? "new"}
              initial={editing}
              onSubmit={async (values) => {
                const now = Date.now();
                const player: Player = {
                  id: editing?.id ?? crypto.randomUUID(),
                  name: values.name,
                  jerseyNumber: values.jerseyNumber,
                  primaryPosition: values.primaryPosition,
                  secondaryPositions: values.secondaryPositions,
                  isActive: true,
                  createdAt: editing?.createdAt ?? now,
                  updatedAt: now,
                };
                await upsertPlayer(player);
                toast.success(editing ? "Player updated" : "Player added");
                setOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
