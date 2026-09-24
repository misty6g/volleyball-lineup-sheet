"use client";

import { create } from "zustand";
import { repository } from "@/db/repository";
import type {
  AppSettings,
  Lineup,
  Player,
  TeamMeta,
} from "@/domain/types";
import { DEFAULT_SETTINGS } from "@/db/database";

interface AppState {
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  team: TeamMeta | null;
  players: Player[];
  lineups: Lineup[];
  settings: AppSettings;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  setError: (error: string | null) => void;
  completeOnboarding: (opts: {
    teamName: string;
    useDemo: boolean;
  }) => Promise<void>;
  upsertPlayer: (player: Player) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  replacePlayers: (players: Player[]) => Promise<void>;
  upsertLineup: (lineup: Lineup) => Promise<void>;
  deleteLineup: (id: string) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  clearAllData: () => Promise<void>;
  seedDemo: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  loading: false,
  error: null,
  team: null,
  players: [],
  lineups: [],
  settings: DEFAULT_SETTINGS,

  setError: (error) => set({ error }),

  hydrate: async () => {
    if (get().hydrated) return;
    set({ loading: true, error: null });
    try {
      const [team, players, lineups, settings] = await Promise.all([
        repository.getTeam(),
        repository.listPlayers(),
        repository.listLineups(),
        repository.getSettings(),
      ]);
      set({
        team: team ?? null,
        players,
        lineups,
        settings,
        hydrated: true,
        loading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load data",
        loading: false,
        hydrated: true,
      });
    }
  },

  refresh: async () => {
    set({ loading: true });
    try {
      const [team, players, lineups, settings] = await Promise.all([
        repository.getTeam(),
        repository.listPlayers(),
        repository.listLineups(),
        repository.getSettings(),
      ]);
      set({
        team: team ?? null,
        players,
        lineups,
        settings,
        loading: false,
        error: null,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to refresh",
        loading: false,
      });
    }
  },

  completeOnboarding: async ({ teamName, useDemo }) => {
    set({ loading: true, error: null });
    try {
      if (useDemo) {
        await repository.seedDemo();
      } else {
        const t = Date.now();
        await repository.saveTeam({
          id: crypto.randomUUID(),
          name: teamName.trim() || "My Team",
          onboardingComplete: true,
          createdAt: t,
          updatedAt: t,
        });
        await repository.saveSettings(DEFAULT_SETTINGS);
      }
      await get().refresh();
      set({ hydrated: true, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Onboarding failed",
        loading: false,
      });
      throw e;
    }
  },

  upsertPlayer: async (player) => {
    await repository.upsertPlayer(player);
    await get().refresh();
  },

  deletePlayer: async (id) => {
    await repository.deletePlayer(id);
    await get().refresh();
  },

  replacePlayers: async (players) => {
    await repository.replacePlayers(players);
    await get().refresh();
  },

  upsertLineup: async (lineup) => {
    await repository.upsertLineup(lineup);
    await get().refresh();
  },

  deleteLineup: async (id) => {
    await repository.deleteLineup(id);
    await get().refresh();
  },

  saveSettings: async (settings) => {
    await repository.saveSettings(settings);
    set({ settings });
  },

  clearAllData: async () => {
    await repository.clearAll();
    set({
      team: null,
      players: [],
      lineups: [],
      settings: DEFAULT_SETTINGS,
      hydrated: true,
    });
  },

  seedDemo: async () => {
    await repository.seedDemo();
    await get().refresh();
  },
}));
