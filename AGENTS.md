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
