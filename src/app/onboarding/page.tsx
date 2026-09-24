"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Volleyball } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const loading = useAppStore((s) => s.loading);
  const [teamName, setTeamName] = useState("RIT Men's Volleyball");

  const start = async (useDemo: boolean) => {
    try {
      await completeOnboarding({ teamName, useDemo });
      toast.success(useDemo ? "Demo team loaded" : "Team created");
      router.replace("/lineups");
    } catch {
      toast.error("Could not finish setup");
    }
  };

  return (
    <main className="flex flex-1 flex-col px-5 pb-10 pt-16" data-testid="onboarding">
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-rit/20 text-rit shadow-[0_0_40px_rgba(247,105,0,0.35)]">
          <Volleyball className="size-8" />
        </div>
        <p className="mb-2 text-xs font-semibold tracking-[0.25em] text-rit uppercase">
          Rotation Board
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Lineups that move with the match
        </h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Build serve-receive, rotate on side-out, manage libero swaps — all offline
          on your phone. Tuned for RIT Men&apos;s Volleyball gym nights.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-card/80 p-4">
        <div className="space-y-2">
          <Label htmlFor="team-name">Team name</Label>
          <Input
            id="team-name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name"
            data-testid="team-name-input"
          />
        </div>
        <Button
          className="h-12 w-full bg-rit text-black hover:bg-rit/90"
          disabled={loading}
          onClick={() => void start(true)}
          data-testid="load-demo"
        >
          Load demo roster & lineups
        </Button>
        <Button
          variant="outline"
          className="h-12 w-full border-white/15"
          disabled={loading}
          onClick={() => void start(false)}
          data-testid="start-empty"
        >
          Start with empty roster
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Demo uses fictional athletes only — never real RIT players.
        </p>
      </div>
    </main>
  );
}
