import { z } from "zod";
import type { CourtZone, PositionCode } from "./types";

export const positionCodeSchema = z.enum(["S", "OH", "RS", "MB", "L", "DS"]);

export const courtZoneSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const lineupSystemSchema = z.enum(["5-1", "6-2", "custom"]);

export const courtAssignmentSchema = z.object({
  1: z.string().nullable(),
  2: z.string().nullable(),
  3: z.string().nullable(),
  4: z.string().nullable(),
  5: z.string().nullable(),
  6: z.string().nullable(),
});

export const playerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  jerseyNumber: z.number().int().min(0).max(99).nullable(),
  primaryPosition: positionCodeSchema,
  secondaryPositions: z.array(positionCodeSchema),
  isActive: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const lineupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  system: lineupSystemSchema,
  court: courtAssignmentSchema,
  liberoId: z.string().nullable(),
  notes: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const teamMetaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  onboardingComplete: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const appSettingsSchema = z.object({
  id: z.literal("settings"),
  hapticFeedback: z.boolean(),
  showJerseyNumbers: z.boolean(),
  confirmRotate: z.boolean(),
});

export const exportBundleSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  team: teamMetaSchema,
  players: z.array(playerSchema),
  lineups: z.array(lineupSchema),
  settings: appSettingsSchema,
});

export const playerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  jerseyNumber: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v.trim() === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    })
    .pipe(z.number().int().min(0).max(99).nullable()),
  primaryPosition: positionCodeSchema,
  secondaryPositions: z.array(positionCodeSchema).default([]),
});

export const lineupFormSchema = z.object({
  name: z.string().min(1, "Lineup name is required"),
  system: lineupSystemSchema,
  notes: z.string().default(""),
  liberoId: z.string().nullable(),
});

/** CSV row schema matching Name,Position,Secondary columns. */
export const csvRowSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  secondary: z.string().optional().default(""),
});

const POSITION_ALIASES: Record<string, PositionCode> = {
  setter: "S",
  s: "S",
  outside: "OH",
  oh: "OH",
  "outside hitter": "OH",
  "right side": "RS",
  rs: "RS",
  opposite: "RS",
  "right-side": "RS",
  middle: "MB",
  mb: "MB",
  "middle blocker": "MB",
  libero: "L",
  l: "L",
  ds: "DS",
  "defensive specialist": "DS",
};

export function parsePositionLabel(raw: string): PositionCode | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  return POSITION_ALIASES[key] ?? null;
}

export type PlayerFormValues = z.infer<typeof playerFormSchema>;
export type LineupFormValues = z.infer<typeof lineupFormSchema>;
export type ExportBundleInput = z.infer<typeof exportBundleSchema>;

export function isCourtZone(n: number): n is CourtZone {
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5 || n === 6;
}
