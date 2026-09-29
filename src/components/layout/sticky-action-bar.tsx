"use client";

import { Redo2, RotateCw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
  onUndo?: () => void;
  onRotate?: () => void;
  onMatchMode?: () => void;
  canUndo?: boolean;
  rotateLabel?: string;
  matchLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function StickyActionBar({
  onUndo,
  onRotate,
  onMatchMode,
  canUndo = false,
  rotateLabel = "Rotate",
  matchLabel = "Match Mode",
  className,
  disabled = false,
}: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[3.75rem] z-30 mx-auto max-w-md px-3 pb-[env(safe-area-inset-bottom)]",
        "landscape:bottom-[2.75rem] landscape:max-w-5xl landscape:px-2 landscape:pb-1",
        className,
      )}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-md landscape:gap-1.5 landscape:rounded-xl landscape:p-1.5">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 flex-1 border-white/15 bg-white/5 landscape:h-10"
          disabled={disabled || !canUndo || !onUndo}
          onClick={onUndo}
          data-testid="btn-undo"
        >
          <Undo2 className="size-4" />
          Undo
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-12 flex-[1.3] bg-rit text-black hover:bg-rit/90 landscape:h-10"
          disabled={disabled || !onRotate}
          onClick={onRotate}
          data-testid="btn-rotate"
        >
          <RotateCw className="size-4" />
          <span className="truncate">{rotateLabel}</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-12 flex-1 landscape:h-10"
          disabled={disabled || !onMatchMode}
          onClick={onMatchMode}
          data-testid="btn-match-mode"
        >
          <Redo2 className="size-4" />
          <span className="truncate">{matchLabel}</span>
        </Button>
      </div>
    </div>
  );
}
