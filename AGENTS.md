# AGENTS.md

## Project

This repository is for **Tercio: Sangre y Acero**, a web-first browser management RPG inspired by games like Gladiatus, but set around Spanish tercios and early modern military hardship.

The player starts as a poor **bisoño** and progresses through training, equipment, missions, wounds, fatigue, honor, delayed pay, and rank.

## Core Direction

This is a web application first. The main client lives in `/web`.

Use normal web UI for most gameplay:

- barracks
- soldier profile
- inventory
- equipment
- shop/armory
- training
- missions
- reports
- hospital
- rankings
- company systems

Canvas is optional and should only be used for visual flavor:

- soldier avatar preview
- duel preview
- mission scene
- campaign map decoration
- banner visuals
- small effects

Do not build the entire UI in canvas.

### Layout & Design System
- **Sidebar Integration**: The player's main status metrics (name, rank, coins, honor, XP, fatigue) are integrated directly at the top of the left sidebar (`SidebarNav`), maximizing screen space for actual gameplay viewports.
- **Independent Scroll**: Both the Sidebar and the Main viewport scroll independently (`overflow-y-auto` and `h-screen`) to prevent viewport scrolling conflicts.
- **Menu Typography**: Menu labels in the sidebar must be large enough to be easily readable (using `text-[13px]` or larger rather than tiny `text-[9px]`).
- **Vector Menu Icons**: The navigation menu uses Lucide React SVG vector icons with gold and iron interactive transitions for a sleek, lightweight, and modern feel.
- **Thinner Borders & Less Glow**: Panels and buttons use 1px solid borders rather than heavy 2px lines, and glows/inset shadows are kept subtle for a cleaner layout.

## Not This

This is not:

- a Godot-first game
- an open-world RPG
- a real-time action game
- a tactical grid combat game
- a full historical simulation
- a fantasy RPG
- a multiplayer game yet

The previous Godot scaffold may remain as reference, but do not reintroduce Godot as the main client unless explicitly requested.

## Preferred Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Seed data for initial content

Optional later:

- PixiJS
- Phaser
- plain Canvas modules
- Supabase/Auth.js
- ranking backend
- asynchronous PvP

## AI Asset Pipeline

Local AI asset generation support lives in `/ai` and `/scripts`.

- Use ComfyUI installed outside this repo.
- Set `COMFYUI_DIR` to the absolute ComfyUI folder.
- Optional Civitai token env var: `CIVITAI_API_TOKEN`. Local fallback `CIVITAI_TOKEN` may exist, but never print or commit tokens.
- Model manifests live in `ai/models/`.
- Prompt templates live in `ai/prompts/`.
- Downloaded model weights must never be committed.
- First approved pack is SDXL-only. Do not add Pony, Illustrious, SD1.5, Flux, anime, celebrity, POI, NSFW, fetish, or modern military models unless explicitly approved.
- Style is a **clean, historical painterly style** (illustrative Renaissance game art) using the **DreamShaper XL** checkpoint. Prompts and settings must avoid dirty realism/mud/soot textures in visual assets to maintain a clean, high-contrast, premium look.

Useful commands:

```text
python scripts/print_model_plan.py
python scripts/download_civitai_models.py --dry-run
python scripts/download_civitai_models.py --download
python scripts/verify_comfyui_models.py
```

Before downloading, fill exact Civitai model version IDs, review licenses manually, and enable entries one by one.

## Main Routes

Expected MVP routes:

```text
/barracks
/soldier
/training
/inventory
/equipment
/armory
/missions
/missions/[id]
/reports/[id]
/hospital
```

Future routes:

```text
/company
/rankings
/duels
/market
/admin
/map
```

## Core Systems

Required systems:

- Soldier profile
- Stats
- Ranks
- Training
- Inventory
- Equipment
- Shop/Armory
- Missions/Campaigns
- Automatic resolver
- Report generator
- Wounds/status effects
- Fatigue
- Rewards and loot

Future systems:

- Companies/guilds
- Rankings
- PvP duels
- Market
- Campaign seasons
- Canvas visuals

Do not implement future systems unless explicitly requested.

## AI Agent Rules

When working on this repo:

1. Read this file first.
2. Inspect the repo before editing.
3. Keep the project web-first.
4. Do not move core UI into canvas.
5. Do not reintroduce Godot as the main client.
6. Do not add real-time combat.
7. Do not add open-world exploration.
8. Do not add multiplayer/PvP until the single-player MVP works.
9. Keep data and formulas simple.
10. Preserve Prisma schema unless explicitly instructed.
11. Make small, reviewable changes.
12. Use placeholder assets only.
13. Do not add copyrighted assets.
14. Document schema or behavior changes.
15. Summarize files changed after each task.

## MVP Goal

The MVP should allow this loop:

1. Open barracks.
2. View soldier profile.
3. Train one stat.
4. Buy an item in the armory.
5. Equip that item.
6. Select a mission.
7. Resolve the mission automatically.
8. Read the generated report.
9. Receive coins, XP, honor, fatigue, wounds, and loot.
10. Return to barracks and see updated state.

Combat is a resolver plus report, not an animated tactical system.

## Default Soldier

Name: Diego de Arce
Rank: bisoño
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
