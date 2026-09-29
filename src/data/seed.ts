import type { Lineup, Player, TeamMeta } from "@/domain/types";
import { emptyCourt } from "@/domain/types";

const now = () => Date.now();

/** Demo team seed for onboarding. */
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
    jersey?: number | null;
    primary: Player["primaryPosition"];
    secondary?: Player["secondaryPositions"];
  }> = [
    { id: "p-lord", name: "Lord Ramos", primary: "S", secondary: ["DS"] },
    { id: "p-sujan", name: "Sujan Pradhan", primary: "S" },
    { id: "p-ethan", name: "Ethan Li", primary: "OH" },
    { id: "p-gyan", name: "Gyan Mistry", primary: "OH" },
    { id: "p-gspot", name: "G-Spot Fletcher", primary: "OH", secondary: ["RS"] },
    { id: "p-marcelo", name: "Marcelo Burton", primary: "OH", secondary: ["DS"] },
    { id: "p-jack", name: "Jack Penland", primary: "RS" },
    { id: "p-milo", name: "Milo Sy", primary: "RS" },
    { id: "p-calvin", name: "Calvin Woo", primary: "MB" },
    { id: "p-emmett", name: "Emmett Peterson", primary: "MB" },
    { id: "p-ibad", name: "Ibad Salman", primary: "RS", secondary: ["MB"] },
    { id: "p-bryan", name: "Bryan Dejesus", primary: "L" },
    { id: "p-kian", name: "Kian Alward", primary: "L", secondary: ["MB"] },
  ];

  return specs.map((s) => ({
    id: s.id,
    name: s.name,
    jerseyNumber: s.jersey ?? null,
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
      1: "p-lord", // S server
      2: "p-jack", // RS
      3: "p-calvin", // MB
      4: "p-ethan", // OH
      5: "p-gyan", // OH
      6: "p-emmett", // MB
    },
    liberoId: "p-bryan",
    plannedSubs: [
      {
        id: "ps-51-r2",
        atRotationIndex: 1,
        outPlayerId: "p-jack",
        inPlayerId: "p-milo",
      },
      {
        id: "ps-51-r4",
        atRotationIndex: 3,
        outPlayerId: "p-gyan",
        inPlayerId: "p-gspot",
      },
    ],
    notes: "Setter starts in zone 1. Libero Bryan for back-row middles.",
    createdAt: baseTime,
    updatedAt: baseTime,
  };

  const sixTwo: Lineup = {
    id: "lu-62-sr",
    name: "6-2 Opening",
    system: "6-2",
    court: {
      1: "p-lord", // S
      2: "p-sujan", // S (front — other setter will set from back when rotated)
      3: "p-calvin",
      4: "p-ethan",
      5: "p-gyan",
      6: "p-emmett",
    },
    liberoId: "p-bryan",
    plannedSubs: [],
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
      1: "p-sujan",
      2: "p-milo",
      3: "p-ibad",
      4: "p-gspot",
      5: "p-marcelo",
      6: "p-calvin",
    },
    liberoId: "p-kian",
    plannedSubs: [],
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
