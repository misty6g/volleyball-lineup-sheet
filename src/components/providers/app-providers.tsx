"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);
  const team = useAppStore((s) => s.team);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const onboarding = pathname === "/onboarding";
    if (!team?.onboardingComplete && !onboarding) {
      router.replace("/onboarding");
    } else if (team?.onboardingComplete && onboarding) {
      router.replace("/lineups");
    }
  }, [hydrated, team, pathname, router]);

  return (
    <>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
        {children}
      </div>
      <BottomNav />
      <Toaster theme="dark" position="top-center" richColors />
    </>
  );
}
