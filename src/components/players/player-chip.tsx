"use client";

import { POSITION_LABELS, type Player, type PositionCode } from "@/domain/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const POSITION_COLOR: Record<PositionCode, string> = {
  S: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  OH: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  RS: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  MB: "bg-violet-500/20 text-violet-300 border-violet-500/40",
  L: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  DS: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
};

export function PositionBadge({
  code,
  className,
}: {
  code: PositionCode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px] tracking-wide uppercase",
        POSITION_COLOR[code],
        className,
      )}
    >
      {code}
    </Badge>
  );
}

export function PlayerChip({
  player,
  showJersey = true,
  compact = false,
  selected = false,
  onClick,
  className,
}: {
  player: Player;
  showJersey?: boolean;
  compact?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-left transition",
        onClick && "hover:border-rit/60 hover:bg-rit/10 active:scale-[0.98]",
        selected && "border-rit bg-rit/15 ring-1 ring-rit/50",
        className,
      )}
    >
      {showJersey && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-black/40 font-mono text-sm font-semibold text-rit">
          {player.jerseyNumber ?? "—"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {player.name}
        </div>
        {!compact && (
          <div className="truncate text-[11px] text-muted-foreground">
            {POSITION_LABELS[player.primaryPosition]}
            {player.secondaryPositions.length > 0 &&
              ` · ${player.secondaryPositions.map((p) => POSITION_LABELS[p]).join(", ")}`}
          </div>
        )}
      </div>
      <PositionBadge code={player.primaryPosition} />
    </Comp>
  );
}
