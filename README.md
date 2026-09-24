# Rotation Board

Mobile-first volleyball lineup manager for **RIT Men's Volleyball**. Build serve-receive lineups, rotate on side-out, manage libero swaps and quick subs — fully offline in the browser.

> Demo roster uses **fictional athletes only**. Never seed real RIT players.

## Stack

- Next.js App Router · React · TypeScript (strict)
- Tailwind CSS · shadcn/ui · Lucide
- Zustand · Dexie (IndexedDB) · Zod · React Hook Form
- PWA (manifest + service worker)
- Vitest · Playwright

## Setup

```bash
npm install
npm run dev -- --port 43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

```bash
npm run build && npm start
```

## Architecture

| Layer | Role |
| --- | --- |
| `src/domain/` | Types, Zod schemas, rotation engine, validation, system autofill |
| `src/db/` | Dexie DB + `LineupRepository` abstraction (swap later for sync) |
| `src/store/` | Zustand app + match stores (undo via snapshots) |
| `src/app/` | Screens: onboarding, roster, builder, match, lineups, rotations, settings |
| `src/components/` | Court diagram, sticky Undo/Rotate/Match bar, shadcn primitives |

**Lineup CSV schema** (source of truth for roster import): `Name,Position,Secondary`.

**Court layout:** Front `4-3-2`, Back `5-6-1`. Zone 1 = server. Clockwise side-out: zone contents move so former Z2 becomes the new server (Z1).

## Testing

```bash
npm test            # Vitest unit tests
npx playwright install chromium
npm run test:e2e    # Playwright flows
npm run typecheck
npm run build
```

## PWA

- `public/manifest.webmanifest` + icons under `public/icons/`
- `public/sw.js` caches the app shell for offline gym use
- Add to Home Screen from mobile Safari/Chrome after first visit over HTTPS (or localhost)

## Deploy

Any Node host that runs `next build` / `next start`, or export via your preferred Next adapter. No backend or env secrets required for MVP — all state is local IndexedDB.

Export/import full JSON backups from **Settings**.
