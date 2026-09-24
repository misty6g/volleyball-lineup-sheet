import Dexie, { type EntityTable } from "dexie";
import type {
  AppSettings,
  Lineup,
  MatchSession,
  Player,
  TeamMeta,
} from "@/domain/types";

export class RotationBoardDB extends Dexie {
  players!: EntityTable<Player, "id">;
  lineups!: EntityTable<Lineup, "id">;
  team!: EntityTable<TeamMeta, "id">;
  settings!: EntityTable<AppSettings, "id">;
  matchSessions!: EntityTable<MatchSession, "id">;

  constructor() {
    super("rotation-board");
    this.version(1).stores({
      players: "id, name, primaryPosition, isActive",
      lineups: "id, name, system, updatedAt",
      team: "id",
      settings: "id",
      matchSessions: "id, lineupId, updatedAt",
    });
  }
}

export const db = new RotationBoardDB();

export const DEFAULT_SETTINGS: AppSettings = {
  id: "settings",
  hapticFeedback: true,
  showJerseyNumbers: true,
  confirmRotate: false,
};
