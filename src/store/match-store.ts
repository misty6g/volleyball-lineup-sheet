"use client";

import { create } from "zustand";
import { repository } from "@/db/repository";
import {
  assignZone,
  cloneCourt,
  findPlayerZone,
  isBackRow,
  rotateClockwise,
  rotationLabel,
} from "@/domain/rotation";
import type {
  CourtAssignment,
  CourtZone,
  Lineup,
  MatchSession,
  MatchSnapshot,
} from "@/domain/types";

const MAX_HISTORY = 50;

function snapshotFrom(session: MatchSession, label: string): MatchSnapshot {
  return {
    court: cloneCourt(session.court),
    rotationIndex: session.rotationIndex,
    liberoOnCourt: session.liberoOnCourt,
    replacedPlayerId: session.replacedPlayerId,
    replacedZone: session.replacedZone,
    label,
    timestamp: Date.now(),
  };
}

interface MatchState {
  session: MatchSession | null;
  loading: boolean;
  error: string | null;
  loadActive: () => Promise<void>;
  startFromLineup: (lineup: Lineup) => Promise<void>;
  pushHistory: (label: string) => void;
  undo: () => Promise<void>;
  rotate: () => Promise<void>;
  quickSub: (zone: CourtZone, incomingPlayerId: string) => Promise<void>;
  liberoIn: (zone: CourtZone) => Promise<void>;
  liberoOut: () => Promise<void>;
  endMatch: () => Promise<void>;
  canUndo: () => boolean;
}

async function persist(session: MatchSession) {
  const next = { ...session, updatedAt: Date.now() };
  await repository.saveMatch(next);
  return next;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  session: null,
  loading: false,
  error: null,

  loadActive: async () => {
    set({ loading: true });
    try {
      const session = (await repository.getActiveMatch()) ?? null;
      set({ session, loading: false, error: null });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load match",
        loading: false,
      });
    }
  },

  startFromLineup: async (lineup) => {
    const session: MatchSession = {
      id: crypto.randomUUID(),
      lineupId: lineup.id,
      lineupName: lineup.name,
      system: lineup.system,
      court: cloneCourt(lineup.court),
      rotationIndex: 0,
      liberoId: lineup.liberoId,
      liberoOnCourt: false,
      replacedPlayerId: null,
      replacedZone: null,
      history: [],
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };
    await repository.clearMatch();
    await repository.saveMatch(session);
    set({ session, error: null });
  },

  pushHistory: (label) => {
    const { session } = get();
    if (!session) return;
    const history = [
      ...session.history,
      snapshotFrom(session, label),
    ].slice(-MAX_HISTORY);
    set({ session: { ...session, history } });
  },

  canUndo: () => (get().session?.history.length ?? 0) > 0,

  undo: async () => {
    const { session } = get();
    if (!session || session.history.length === 0) return;
    const history = [...session.history];
    const prev = history.pop()!;
    const restored: MatchSession = {
      ...session,
      court: cloneCourt(prev.court),
      rotationIndex: prev.rotationIndex,
      liberoOnCourt: prev.liberoOnCourt,
      replacedPlayerId: prev.replacedPlayerId,
      replacedZone: prev.replacedZone,
      history,
    };
    set({ session: await persist(restored) });
  },

  rotate: async () => {
    const { session } = get();
    if (!session) return;
    const history = [
      ...session.history,
      snapshotFrom(session, `Before ${rotationLabel(session.rotationIndex + 1)}`),
    ].slice(-MAX_HISTORY);

    let court = rotateClockwise(session.court);
    let liberoOnCourt = session.liberoOnCourt;
    let replacedPlayerId = session.replacedPlayerId;
    let replacedZone = session.replacedZone;

    // If libero was on court, track the zone they moved into after rotate
    if (liberoOnCourt && session.liberoId) {
      const zone = findPlayerZone(court, session.liberoId);
      if (zone && !isBackRow(zone)) {
        // Libero illegally rotated front — auto swap back with replaced player if known
        if (replacedPlayerId) {
          court = assignZone(court, zone, replacedPlayerId);
          replacedZone = null;
          replacedPlayerId = null;
          liberoOnCourt = false;
        }
      } else if (zone) {
        replacedZone = zone;
      }
    }

    const next: MatchSession = {
      ...session,
      court,
      rotationIndex: (session.rotationIndex + 1) % 6,
      liberoOnCourt,
      replacedPlayerId,
      replacedZone,
      history,
    };
    set({ session: await persist(next) });
  },

  quickSub: async (zone, incomingPlayerId) => {
    const { session } = get();
    if (!session) return;
    const history = [
      ...session.history,
      snapshotFrom(session, `Sub zone ${zone}`),
    ].slice(-MAX_HISTORY);
    const court = assignZone(session.court, zone, incomingPlayerId);
    // If we subbed over the libero slot, clear libero tracking
    let liberoOnCourt = session.liberoOnCourt;
    let replacedPlayerId = session.replacedPlayerId;
    let replacedZone = session.replacedZone;
    if (session.liberoId && incomingPlayerId !== session.liberoId) {
      if (session.court[zone] === session.liberoId) {
        liberoOnCourt = false;
        replacedPlayerId = null;
        replacedZone = null;
      }
    }
    const next: MatchSession = {
      ...session,
      court,
      history,
      liberoOnCourt,
      replacedPlayerId,
      replacedZone,
    };
    set({ session: await persist(next) });
  },

  liberoIn: async (zone) => {
    const { session } = get();
    if (!session?.liberoId) return;
    if (!isBackRow(zone)) {
      set({ error: "Libero can only enter a back-row zone" });
      return;
    }
    const outgoing = session.court[zone];
    if (!outgoing) {
      set({ error: "No player in that zone to replace" });
      return;
    }
    const history = [
      ...session.history,
      snapshotFrom(session, `Libero in zone ${zone}`),
    ].slice(-MAX_HISTORY);
    const court = assignZone(session.court, zone, session.liberoId);
    const next: MatchSession = {
      ...session,
      court,
      history,
      liberoOnCourt: true,
      replacedPlayerId: outgoing,
      replacedZone: zone,
    };
    set({ session: await persist(next), error: null });
  },

  liberoOut: async () => {
    const { session } = get();
    if (!session?.liberoOnCourt || !session.replacedPlayerId) return;
    const zone =
      session.replacedZone ??
      (session.liberoId
        ? findPlayerZone(session.court, session.liberoId)
        : null);
    if (!zone) return;
    const history = [
      ...session.history,
      snapshotFrom(session, "Libero out"),
    ].slice(-MAX_HISTORY);
    const court = assignZone(session.court, zone, session.replacedPlayerId);
    const next: MatchSession = {
      ...session,
      court,
      history,
      liberoOnCourt: false,
      replacedPlayerId: null,
      replacedZone: null,
    };
    set({ session: await persist(next) });
  },

  endMatch: async () => {
    await repository.clearMatch();
    set({ session: null });
  },
}));

export type { CourtAssignment };
