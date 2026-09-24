import { parsePositionLabel } from "@/domain/schema";
import type { Player, PositionCode } from "@/domain/types";

export interface CsvParseResult {
  players: Omit<Player, "id" | "createdAt" | "updatedAt">[];
  errors: string[];
}

/**
 * Parse CSV with headers Name,Position,Secondary (order flexible).
 * Matches the lineup sheet schema: Name, Position, Secondary.
 */
export function parseRosterCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const errors: string[] = [];
  if (lines.length === 0) {
    return { players: [], errors: ["CSV is empty"] };
  }

  const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const nameIdx = header.findIndex((h) => h === "name");
  const posIdx = header.findIndex((h) => h === "position");
  const secIdx = header.findIndex((h) => h === "secondary");

  if (nameIdx < 0 || posIdx < 0) {
    return {
      players: [],
      errors: ["CSV must include Name and Position columns"],
    };
  }

  const players: CsvParseResult["players"] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]!);
    const name = (cols[nameIdx] ?? "").trim();
    const posRaw = (cols[posIdx] ?? "").trim();
    const secRaw = secIdx >= 0 ? (cols[secIdx] ?? "").trim() : "";

    if (!name) {
      errors.push(`Row ${i + 1}: missing name`);
      continue;
    }

    const primary = parsePositionLabel(posRaw);
    if (!primary) {
      errors.push(`Row ${i + 1}: unknown position "${posRaw}"`);
      continue;
    }

    const secondaryPositions: PositionCode[] = [];
    if (secRaw) {
      for (const part of secRaw.split(/[|/&,]+/)) {
        const parsed = parsePositionLabel(part.trim());
        if (parsed && parsed !== primary) secondaryPositions.push(parsed);
        else if (part.trim() && !parsed) {
          errors.push(`Row ${i + 1}: unknown secondary "${part.trim()}"`);
        }
      }
    }

    players.push({
      name,
      jerseyNumber: null,
      primaryPosition: primary,
      secondaryPositions,
      isActive: true,
    });
  }

  return { players, errors };
}

export function exportRosterCsv(players: Player[]): string {
  const rows = ["Name,Position,Secondary"];
  const label: Record<PositionCode, string> = {
    S: "Setter",
    OH: "Outside",
    RS: "Right Side",
    MB: "Middle",
    L: "Libero",
    DS: "DS",
  };
  for (const p of players) {
    const secondary = p.secondaryPositions.map((c) => label[c]).join(" / ");
    rows.push(
      `${escapeCsv(p.name)},${label[p.primaryPosition]},${escapeCsv(secondary)}`,
    );
  }
  return rows.join("\n");
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
