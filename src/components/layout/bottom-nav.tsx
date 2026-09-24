"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutGrid,
  Settings,
  Shirt,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/lineups", label: "Lineups", icon: ClipboardList },
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/lineup", label: "Builder", icon: LayoutGrid },
  { href: "/match", label: "Match", icon: Target },
  { href: "/rotations", label: "Rots", icon: Shirt },
  { href: "/settings", label: "More", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/onboarding") return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/lineups"
              ? pathname === "/lineups" || pathname === "/"
              : href === "/lineup"
                ? pathname === "/lineup" || pathname.startsWith("/lineup?")
                : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition",
                  active ? "text-rit" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "drop-shadow-[0_0_6px_rgba(247,105,0,0.6)]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
