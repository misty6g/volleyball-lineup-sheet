import type { Lineup, Player, TeamMeta } from "@/domain/types";
import { emptyCourt } from "@/domain/types";

const now = () => Date.now();

/** Fictional demo roster — never use real RIT athletes. */
export const DEMO_TEAM: TeamMeta = {
  id: "team-demo-tiger",
  name: "RIT Men's Volleyball (Demo)",
  onboardingComplete: true,
  createdAt: 0,
  updatedAt: 0,
};

export function createDemoPlayers(baseTime = now()): Player[] {
  const specs: Array<{
    id: string;
    name: string;
    jersey: number;
    primary: Player["primaryPosition"];
    secondary?: Player["secondaryPositions"];
  }> = [
    { id: "p-owen", name: "Owen Hartwell", jersey: 2, primary: "S", secondary: ["DS"] },
    { id: "p-kai", name: "Kai Nakamura", jersey: 7, primary: "S" },
    { id: "p-marcus", name: "Marcus Ellison", jersey: 9, primary: "OH" },
    { id: "p-devon", name: "Devon Price", jersey: 11, primary: "OH" },
    { id: "p-reid", name: "Reid Calder", jersey: 14, primary: "OH", secondary: ["RS"] },
    { id: "p-nate", name: "Nate Okonkwo", jersey: 5, primary: "OH", secondary: ["DS"] },
    { id: "p-felix", name: "Felix Grant", jersey: 17, primary: "RS" },
    { id: "p-theo", name: "Theo Vargas", jersey: 21, primary: "RS" },
    { id: "p-cole", name: "Cole Brennan", jersey: 4, primary: "MB" },
    { id: "p-isaac", name: "Isaac Cho", jersey: 13, primary: "MB" },
    { id: "p-ben", name: "Ben Ortega", jersey: 8, primary: "RS", secondary: ["MB"] },
    { id: "p-leo", name: "Leo Santos", jersey: 1, primary: "L" },
    { id: "p-jamie", name: "Jamie Whitaker", jersey: 6, primary: "L", secondary: ["MB"] },
    { id: "p-sam", name: "Sam Rivera", jersey: 15, primary: "DS", secondary: ["OH"] },
    { id: "p-adrian", name: "Adrian Brooks", jersey: 3, primary: "MB", secondary: ["RS"] },
  ];

  return specs.map((s) => ({
    id: s.id,
    name: s.name,
    jerseyNumber: s.jersey,
    primaryPosition: s.primary,
    secondaryPositions: s.secondary ?? [],
    isActive: true,
    createdAt: baseTime,
    updatedAt: baseTime,
  }));
}

export function createDemoLineups(baseTime = now()): Lineup[] {
  const fiveOne: Lineup = {
    id: "lu-51-sr",
    name: "5-1 Serve Receive",
    system: "5-1",
    court: {
      1: "p-owen",
      2: "p-felix",
      3: "p-cole",
      4: "p-marcus",
      5: "p-devon",
      6: "p-isaac",
    },
    liberoId: "p-leo",
    notes: "Setter starts in zone 1. Libero Leo for back-row middles.",
    createdAt: baseTime,
    updatedAt: baseTime,
  };

  const sixTwo: Lineup = {
    id: "lu-62-sr",
    name: "6-2 Opening",
    system: "6-2",
    court: {
      1: "p-owen",
      2: "p-kai",
      3: "p-cole",
      4: "p-marcus",
      5: "p-reid",
      6: "p-isaac",
    },
    liberoId: "p-leo",
    notes: "Two setters opposite. Back-row setter runs the offense.",
    createdAt: baseTime + 1,
    updatedAt: baseTime + 1,
  };

  const custom: Lineup = {
    id: "lu-custom-scrap",
    name: "Custom Scrimmage",
    system: "custom",
    court: {
      ...emptyCourt(),
      1: "p-kai",
      2: "p-theo",
      3: "p-adrian",
      4: "p-nate",
      5: "p-sam",
      6: "p-ben",
    },
    liberoId: "p-jamie",
    notes: "Mixed group for midweek scrimmage.",
    createdAt: baseTime + 2,
    updatedAt: baseTime + 2,
  };

  return [fiveOne, sixTwo, custom];
}

export function createFreshTeam(name: string): TeamMeta {
  const t = now();
  return {
    id: crypto.randomUUID(),
    name,
    onboardingComplete: true,
    createdAt: t,
    updatedAt: t,
  };
}
