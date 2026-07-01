# AGENTS.md

## Project

This repository is for **Tercio: Sangre y Acero**, a web-first browser management RPG inspired by Gladiatus de Gameforce, but set around Spanish tercios and early modern military hardship.

The player starts as a poor **bisono** and progresses through training, equipment, missions, wounds, fatigue, honor, delayed pay, and rank.

## Core Direction

The main client lives in `/web`. Use normal web UI for most gameplay:

- barracks (barracones)
- soldier profile (perfil del soldado)
- inventory (inventario)
- equipment (equipo)
- shop/armory (armería)
- training (entrenamiento)
- missions (misiones con mapa de nodos)
- reports (reportes de combate con simulador visual)
- hospital (cirujano de campaña)
- rankings (clasificación)
- company systems (compañías/gremios)

Canvas is built using PIXI.js and GSAP/Motion, and is used strictly for visual flavor:

- soldier avatar preview
- duel preview
- mission/combat canvas resolver (with animated sprites, sound effects, coin rain, and status text)
- campaign map decoration
- banner visuals
- small effects

Do not build the whole UI in canvas. Keep navigation, buttons, stats, and dialogs as standard HTML/React components styled with Tailwind CSS.

## Layout & Design System

**Source of truth for measurements**: [`DESIGN.md`](DESIGN.md) at the project root.
Update DESIGN.md first, then mirror the changes into the CSS custom
properties declared in `web/src/app/globals.css` (`:root` block).
The token names map 1:1 to the spec (e.g. `--sidebar-width`,
`--topbar-medallion`, `--cofre-player-cell`).

- Player status metrics live at the top of the left sidebar.
- Sidebar and main viewport scroll independently.
- Sidebar labels use `text-[10px]` / `text-[11px]` (CSS overrides bump
  these inside `.sidebar-shell` so they remain legible).
- Navigation uses Lucide React vector icons as fallback; dedicated
  icons live in `GPT-ASSETS/icons-ui`.
- Panels and buttons use 1-3px borders and restrained shadows (gritty,
  early-modern aesthetic).
- Tooltips: Use custom hover tooltips for stats, equipment slots, and
  status effects. Avoid inline help text to keep the layout clean and
  modern.
- Compact game components (tooltips, item cards, slots, chips, stat rows)
  must be size-bounded: use `min-w-0`, `truncate` or `line-clamp-*`,
  `max-height`, and internal `overflow-y-auto` when content can exceed the
  box. Do not let text resize the game shell or overflow the viewport.
- Visible JSX text must not include literal Unicode escape strings such as
  `\u00b7` or `\u2265`; render the real character/entity and add a UX test
  for encoding-sensitive fixes. Compact item effects must show Spanish labels,
  not raw keys such as `armor`, `damageMin`, or `damageMax`.
- Viewport base for mockups: **1280x800**. Reference mockup canvas
  in `DESIGN/*.png` is **1672x941**.
- Border radius cap: 6px. No glow, no neon, no fantasy palette.

## Not This

This is not:

- a Godot-first game (Godot files exist only as legacy references)
- an open-world RPG
- a real-time action game
- a tactical grid combat game
- a full historical simulation
- a fantasy RPG
- a multiplayer game yet

Do not reintroduce Godot as the main client.

## Preferred Stack

- Next.js (App Router, Turbopack)
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- JSON seed data in `data/` as the single source of truth for items, ranks, missions, and assets.

Use `pnpm` for package management.

## Local Flask Backend

`backend/` is the typed Flask migration backend for localhost testing. It is
not the Dokploy production entrypoint yet.

- Use `docker compose -f docker-compose.local.yml up --build` for the full
  local stack: Next.js, Flask, and PostgreSQL.
- If port 3000 is busy, set `TERCIO_WEB_PORT`, for example:
  `TERCIO_WEB_PORT=3010`.
- Flask exposes `/health`, `/api/health`, `/api/catalog`, and
  `/api/character-names` first. Keep auth/state migration incremental.
- Next.js proxies `/api/flask/:path*` to Flask when
  `TERCIO_FLASK_PROXY_TARGET` is set.
- Prisma remains the schema owner for now. Do not add Alembic or duplicate DB
  migrations until Flask owns write endpoints.
- Keep `docker-compose.dokploy.yml` and `Dockerfile.dokploy` separate from
  local Flask work unless production deployment is explicitly requested.

## Asset Bank

`GPT-ASSETS` is the canonical visual bank. Images are prompted manually in ChatGPT, saved into `GPT-ASSETS`, cleaned locally, then indexed into JSON.

Useful commands:

```text
python scripts/process_gpt_assets.py --commit
python scripts/build_asset_bank.py
node web/scripts/sync-data.mjs
```

Rules:

- Keep `GPT-ASSETS` as source of truth for new image assets.
- Keep `data/assets.json` synchronized with real PNG files.
- Link gameplay data through `assetId`, `portraitAssetId`, and `sceneAssetId`.
- Do not commit secrets or external model weights.
- Do not add copyrighted assets.
- Use placeholder assets only when no generated asset exists yet.

## Mature SFW Policy

Historical cruelty can exist in text and events, but visuals must stay SFW.

- No explicit gore.
- No sexualized content.
- No anime as main style.
- Use `mature: true` and `presentation: "blurred"` for harsh events.
- Prefer indirect imagery: silhouettes, smoke, broken gear, bandages, covered bodies, stained ground, tense faces.

## Main Routes

Expected MVP routes:

```text
/barracks       - Barracks hub
/soldier        - Soldier stats & level up
/training       - Stat training & cost resolver
/inventory      - Grid-based inventory
/equipment      - Interactive drag-and-drop slots
/armory         - Buying & selling equipment
/missions       - Interactive map node selection
/missions/[id]  - Map mission setup
/reports/[id]   - Animated Pixi.js combat solver & narrative report
/hospital       - Campaigns wounds healing
```

Future routes:

```text
/company        - Guild/Tercio company management
/rankings       - Soldier rankings
/duels          - Tavern duels (PvP/PvE)
/market         - Player-to-player trade
/admin          - Admin dashboard
/map            - Full map screen
```

## Core Systems

Required systems:

- **Soldier profile:** Tracks experience, stats, rank, and unpaid wages.
- **Stats & Training:** Pike, Sword, Arquebus, Discipline, Vigor, Cunning, Command.
- **Inventory & Equipment:** Supports interactive drag-and-drop between inventory grid and slot components.
- **Shop/Armory:** Interactive buying, selling, and status updates.
- **Missions/Campaigns:** Map-based node navigation.
- **Combat Resolver:** Animated canvas with state machines (Idle, Walk, Attack, Hurt, Dead), coin rains, sound effects, and transitions.
- **Report generator:** Creates detailed combat narrative logs.
- **Wounds & Status effects:** Healing cost scales based on wound severity.
- **Fatigue:** Controls mission eligibility.
- **Rewards and loot:** Loot tables resolve item drops based on probabilities.

## AI Agent Rules

1. Read this file first.
2. Inspect the repo before editing.
3. Keep the project web-first.
4. Do not move core UI into canvas.
5. Do not add real-time combat.
6. Do not add open-world exploration.
7. Do not add multiplayer/PvP until the single-player MVP works.
8. Keep data and formulas simple.
9. Preserve Prisma schema unless explicitly instructed.
10. Make small, reviewable changes.
11. Document schema or behavior changes.
12. Summarize files changed after each task.

## Default Soldier

Name: Diego de Arce
Rank: bisono
Coins: 25
Honor: 0
XP: 0
Fatigue: 0
Unpaid wages: 0

Stats:

- pike: 2
- sword: 1
- arquebus: 1
- discipline: 2
- vigor: 2
- cunning: 1
- command: 0

## Tone

The game should feel like mud, steel, powder smoke, wet boots, delayed pay, harsh discipline, wounds, hunger, honor, pikes, arquebuses, morions, cuirasses, camp disease, sieges, patrols, tavern duels, and company banners.

Avoid magic, high fantasy, chosen-one tropes, shiny heroic tone, modern slang in game text, and generic MMO fantasy item names.

## Browser Support

The target audience plays on a modern desktop browser. We can adopt **Baseline Newly Available** web platform features natively when they provide a clear benefit (perf, accessibility, code reduction), with at most a short custom fallback if the feature carries UX risk.

Currently adopted without fallbacks:

- `content-visibility: auto` + `contain-intrinsic-size: auto` (deferred sections, e.g. recruitment cards, boss list rows) — see `.deferred-section*` in `web/src/app/globals.css`.
- `fetchPriority="high"` (LCP image: `/recruitment` hero, topbar character portrait, topbar logo).
- `loading="lazy"` + `decoding="async"` on off-screen `<img>` (mission list, popup icons).
- `:user-invalid` / `:user-valid` form feedback (`.field:has(...)` rule in `globals.css`).
- `field-sizing: content` for text inputs (preventive; no text inputs in the app today).
- Native `<dialog>` for modals (recruitment stats popup — see `recruitment-card.tsx`). The `::backdrop` pseudo is styled in `globals.css`; the dialog itself uses `showModal()` on mount, `onClose` for Esc handling, and `event.target === event.currentTarget` for backdrop-click dismiss.
- `<link rel="preload" as="image" fetchpriority="high">` for resources hidden in CSS (e.g. the camp background) — emitted from `web/src/components/game/critical-preloads.tsx` via `ReactDOM.preload()`.
- `next/image` with `fill` + `sizes` for LCP-candidate images (training hero, soldier portrait). Smaller thumbnails and decorative patterns stay as raw `<img>` — `next/image` adds no value below ~64px or for already-pixel-perfect assets.

Future `next/image` changes: do not use the deprecated `priority` prop in Next 16 — use `fetchPriority="high"` with `loading="eager"` instead, or `preload={true}` if a real `<link rel="preload">` is wanted. The pre-existing logo in `game-shell.tsx` still uses `priority` and should be migrated in a follow-up.

When adding a new modern web primitive, prefer the `npx -y modern-web-guidance@latest search <query>` skill in `~/.config/opencode/skills/modern-web-guidance/` to retrieve the canonical pattern before improvising.

## Loading & Async States

The client is moving from a synchronous localStorage-backed store to a real backend (Prisma + Django, per `docs/implementation_notes.md`). Every page that reads server data must therefore show a layout-mirroring skeleton while that data is in flight, so the swap to `lib/api/*` is invisible to the user.

**Primitives** (`web/src/components/ui/`):
- `skeleton.tsx` → `<Skeleton>`, `<SkeletonText>`, `<SkeletonCircle>`. Backed by `.skeleton-shimmer` in `globals.css`; degrades to a static block under `prefers-reduced-motion`. Decorative by default; pass `decorative={false}` to opt into an `aria-live="polite"` "Cargando..." announcement.
- `empty-state.tsx` → `<EmptyState title description icon action>` for the "no data here" branch. Promoted from the old inline version in `/recruitment`.
- `error-state.tsx` → `<ErrorState title description onRetry error>` for the `useGameData().status === "error"` branch. Includes a `Reintentar` button when `onRetry` is provided.

**Per-page skeletons** live in `web/src/components/skeletons/<page>-skeleton.tsx` and mirror the real page's chrome (panels, grid shape, portrait slot) using the primitives above. No layout shift on data arrival.

**Async state hook** (`web/src/lib/hooks/use-game-data.ts`):
- Wraps `useGameStore` and exposes `status: "idle" | "loading" | "ready" | "error"`, `error`, `refetch()`.
- Pages render the skeleton when `status !== "ready"` and the real content when `status === "ready"`.
- Today `status` is `ready` immediately (the demo store is sync-ish). When `lib/actions/_demo.ts` is swapped for a real `lib/api/*` client, the same hook gives every page a `loading` window for free.

**Action hook** (`web/src/lib/hooks/use-server-action.ts` + `use-optimistic-action.ts`):
- `useServerAction(action)` wraps a `lib/actions/*` server action with `useTransition` + `sonner` toast on success/failure.
- `useOptimisticAction(action, apply)` does snapshot + rollback on failure, so the store mutates immediately and reverts if the server rejects. Used for the top three flows (train, buy, equip) today; same shape is reusable for any future action.

**Rules:**
1. Never use the bare `animate-pulse` one-liner ("Cargando X...") — that pattern is being phased out. Use the skeleton system instead.
2. Every page that reads from `useGameStore` must be wrapped in a `useGameData()` consumer and render its skeleton during loading.
3. Every action that mutates server state must go through `useServerAction` (or `useOptimisticAction` for instant-feel flows), not be called directly.
4. New loading primitives should be added to `components/ui/skeleton.tsx`, not inlined in a page file.
