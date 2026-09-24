/** Volleyball court zones. Zone 1 is the server (back-right). */
export type CourtZone = 1 | 2 | 3 | 4 | 5 | 6;

export const COURT_ZONES: CourtZone[] = [1, 2, 3, 4, 5, 6];

/** Front row left-to-right, then back row left-to-right for the court diagram. */
export const FRONT_ROW: CourtZone[] = [4, 3, 2];
export const BACK_ROW: CourtZone[] = [5, 6, 1];

export type PositionCode = "S" | "OH" | "RS" | "MB" | "L" | "DS";

export const POSITION_LABELS: Record<PositionCode, string> = {
  S: "Setter",
  OH: "Outside",
  RS: "Right Side",
  MB: "Middle",
  L: "Libero",
  DS: "DS",
};

export const POSITION_CODES: PositionCode[] = [
  "S",
  "OH",
  "RS",
  "MB",
  "L",
  "DS",
];

export type LineupSystem = "5-1" | "6-2" | "custom";

export type CourtAssignment = Record<CourtZone, string | null>;

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number | null;
  primaryPosition: PositionCode;
  secondaryPositions: PositionCode[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Lineup {
  id: string;
  name: string;
  system: LineupSystem;
  /** Starting rotation (R1) court assignments by zone. */
  court: CourtAssignment;
  liberoId: string | null;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface TeamMeta {
  id: string;
  name: string;
  onboardingComplete: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  id: "settings";
  hapticFeedback: boolean;
  showJerseyNumbers: boolean;
  confirmRotate: boolean;
}

export interface ValidationIssue {
  code: string;
  severity: "warning" | "info";
  message: string;
  zone?: CourtZone;
  playerId?: string;
}

export interface MatchSnapshot {
  court: CourtAssignment;
  rotationIndex: number;
  liberoOnCourt: boolean;
  replacedPlayerId: string | null;
  replacedZone: CourtZone | null;
  label: string;
  timestamp: number;
}

export interface MatchSession {
  id: string;
  lineupId: string;
  lineupName: string;
  system: LineupSystem;
  court: CourtAssignment;
  /** 0 = starting R1, 1 = after one rotate, … mod 6 */
  rotationIndex: number;
  liberoId: string | null;
  liberoOnCourt: boolean;
  replacedPlayerId: string | null;
  replacedZone: CourtZone | null;
  history: MatchSnapshot[];
  startedAt: number;
  updatedAt: number;
}

export interface ExportBundle {
  version: 1;
  exportedAt: number;
  team: TeamMeta;
  players: Player[];
  lineups: Lineup[];
  settings: AppSettings;
}

export function emptyCourt(): CourtAssignment {
  return { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
}

export function cloneCourt(court: CourtAssignment): CourtAssignment {
  return {
    1: court[1],
    2: court[2],
    3: court[3],
    4: court[4],
    5: court[5],
    6: court[6],
  };
}
