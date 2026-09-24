"use client";

import { FRONT_ROW, BACK_ROW, type CourtAssignment, type CourtZone, type Player } from "@/domain/types";
import { cn } from "@/lib/utils";
import { PositionBadge } from "@/components/players/player-chip";

interface CourtDiagramProps {
  court: CourtAssignment;
  playersById: Record<string, Player>;
  selectedZone?: CourtZone | null;
  onSelectZone?: (zone: CourtZone) => void;
  highlightServer?: boolean;
  showJersey?: boolean;
  className?: string;
  compact?: boolean;
}

function ZoneCell({
  zone,
  player,
  selected,
  isServer,
  onSelect,
  showJersey,
  compact,
}: {
  zone: CourtZone;
  player: Player | null;
  selected: boolean;
  isServer: boolean;
  onSelect?: () => void;
  showJersey: boolean;
  compact: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      data-zone={zone}
      className={cn(
        "relative flex min-h-[4.5rem] flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/30 p-1.5 text-center transition",
        compact && "min-h-[3.75rem]",
        onSelect && "hover:border-rit/70 hover:bg-rit/10 active:scale-[0.98]",
        selected && "border-rit border-solid bg-rit/20 ring-2 ring-rit/40",
        isServer && "border-rit/80 bg-rit/10",
      )}
    >
      <span className="absolute top-1 left-1.5 font-mono text-[10px] text-white/40">
        Z{zone}
        {isServer ? " · SRV" : ""}
      </span>
      {player ? (
        <>
          {showJersey && (
            <span className="font-mono text-lg font-bold leading-none text-rit">
              {player.jerseyNumber ?? "—"}
            </span>
          )}
          <span
            className={cn(
              "mt-0.5 w-full truncate px-0.5 text-xs font-medium text-white",
              compact && "text-[11px]",
            )}
          >
            {player.name.split(" ").slice(-1)[0]}
          </span>
          <PositionBadge code={player.primaryPosition} className="mt-1" />
        </>
      ) : (
        <span className="text-xs text-white/35">Empty</span>
      )}
    </button>
  );
}

export function CourtDiagram({
  court,
  playersById,
  selectedZone = null,
  onSelectZone,
  highlightServer = true,
  showJersey = true,
  className,
  compact = false,
}: CourtDiagramProps) {
  const renderRow = (zones: CourtZone[]) => (
    <div className="grid grid-cols-3 gap-2">
      {zones.map((zone) => {
        const id = court[zone];
        const player = id ? playersById[id] ?? null : null;
        return (
          <ZoneCell
            key={zone}
            zone={zone}
            player={player}
            selected={selectedZone === zone}
            isServer={highlightServer && zone === 1}
            onSelect={onSelectZone ? () => onSelectZone(zone) : undefined}
            showJersey={showJersey}
            compact={compact}
          />
        );
      })}
    </div>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-court-net via-court to-court-deep p-3 shadow-inner",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase">
          Net
        </span>
        <span className="text-[10px] text-white/40">Front 4 · 3 · 2</span>
      </div>
      <div className="mb-1 h-1 rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      {renderRow(FRONT_ROW)}
      <div className="my-2 border-t border-dashed border-white/15" />
      {renderRow(BACK_ROW)}
      <div className="mt-2 text-center text-[10px] text-white/40">
        Back 5 · 6 · 1 (server)
      </div>
    </div>
  );
}
