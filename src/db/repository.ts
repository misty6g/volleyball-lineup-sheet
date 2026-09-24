import {
  createDemoLineups,
  createDemoPlayers,
  DEMO_TEAM,
} from "@/data/seed";
import {
  appSettingsSchema,
  exportBundleSchema,
  lineupSchema,
  playerSchema,
  teamMetaSchema,
} from "@/domain/schema";
import type {
  AppSettings,
  ExportBundle,
  Lineup,
  MatchSession,
  Player,
  TeamMeta,
} from "@/domain/types";
import { db, DEFAULT_SETTINGS } from "./database";

/**
 * Repository abstraction over IndexedDB (Dexie).
 * Swap this layer later for remote sync without touching UI.
 */
export interface LineupRepository {
  getTeam(): Promise<TeamMeta | undefined>;
  saveTeam(team: TeamMeta): Promise<void>;
  listPlayers(): Promise<Player[]>;
  upsertPlayer(player: Player): Promise<void>;
  deletePlayer(id: string): Promise<void>;
  replacePlayers(players: Player[]): Promise<void>;
  listLineups(): Promise<Lineup[]>;
  getLineup(id: string): Promise<Lineup | undefined>;
  upsertLineup(lineup: Lineup): Promise<void>;
  deleteLineup(id: string): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  getActiveMatch(): Promise<MatchSession | undefined>;
  saveMatch(session: MatchSession): Promise<void>;
  clearMatch(): Promise<void>;
  exportAll(): Promise<ExportBundle>;
  importAll(bundle: ExportBundle): Promise<void>;
  clearAll(): Promise<void>;
  seedDemo(): Promise<void>;
  isInitialized(): Promise<boolean>;
}

export const localRepository: LineupRepository = {
  async getTeam() {
    return db.team.toCollection().first();
  },

  async saveTeam(team) {
    const parsed = teamMetaSchema.parse(team);
    await db.team.put(parsed);
  },

  async listPlayers() {
    return db.players.orderBy("name").toArray();
  },

  async upsertPlayer(player) {
    await db.players.put(playerSchema.parse(player));
  },

  async deletePlayer(id) {
    await db.players.delete(id);
  },

  async replacePlayers(players) {
    await db.transaction("rw", db.players, async () => {
      await db.players.clear();
      await db.players.bulkPut(players.map((p) => playerSchema.parse(p)));
    });
  },

  async listLineups() {
    return db.lineups.orderBy("updatedAt").reverse().toArray();
  },

  async getLineup(id) {
    return db.lineups.get(id);
  },

  async upsertLineup(lineup) {
    await db.lineups.put(lineupSchema.parse(lineup));
  },

  async deleteLineup(id) {
    await db.lineups.delete(id);
  },

  async getSettings() {
    const existing = await db.settings.get("settings");
    if (existing) return appSettingsSchema.parse(existing);
    await db.settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings) {
    await db.settings.put(appSettingsSchema.parse(settings));
  },

  async getActiveMatch() {
    return db.matchSessions.orderBy("updatedAt").reverse().first();
  },

  async saveMatch(session) {
    await db.matchSessions.put(session);
  },

  async clearMatch() {
    await db.matchSessions.clear();
  },

  async exportAll() {
    const team = await this.getTeam();
    if (!team) {
      throw new Error("No team to export");
    }
    const bundle: ExportBundle = {
      version: 1,
      exportedAt: Date.now(),
      team,
      players: await this.listPlayers(),
      lineups: await this.listLineups(),
      settings: await this.getSettings(),
    };
    return exportBundleSchema.parse(bundle);
  },

  async importAll(bundle) {
    const parsed = exportBundleSchema.parse(bundle);
    await db.transaction(
      "rw",
      db.team,
      db.players,
      db.lineups,
      db.settings,
      db.matchSessions,
      async () => {
        await db.matchSessions.clear();
        await db.team.clear();
        await db.players.clear();
        await db.lineups.clear();
        await db.team.put(parsed.team);
        await db.players.bulkPut(parsed.players);
        await db.lineups.bulkPut(parsed.lineups);
        await db.settings.put(parsed.settings);
      },
    );
  },

  async clearAll() {
    await db.transaction(
      "rw",
      db.team,
      db.players,
      db.lineups,
      db.settings,
      db.matchSessions,
      async () => {
        await db.team.clear();
        await db.players.clear();
        await db.lineups.clear();
        await db.settings.clear();
        await db.matchSessions.clear();
      },
    );
  },

  async seedDemo() {
    const t = Date.now();
    const team = { ...DEMO_TEAM, createdAt: t, updatedAt: t };
    const players = createDemoPlayers(t);
    const lineups = createDemoLineups(t);
    await db.transaction(
      "rw",
      db.team,
      db.players,
      db.lineups,
      db.settings,
      db.matchSessions,
      async () => {
        await db.matchSessions.clear();
        await db.team.clear();
        await db.players.clear();
        await db.lineups.clear();
        await db.team.put(team);
        await db.players.bulkPut(players);
        await db.lineups.bulkPut(lineups);
        await db.settings.put(DEFAULT_SETTINGS);
      },
    );
  },

  async isInitialized() {
    const team = await this.getTeam();
    return Boolean(team?.onboardingComplete);
  },
};

/** Current repository binding — replace for future sync backends. */
export let repository: LineupRepository = localRepository;

export function setRepository(next: LineupRepository): void {
  repository = next;
}
