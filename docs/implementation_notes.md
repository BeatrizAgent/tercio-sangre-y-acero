# Implementation Notes - Tercio: Sangre y Acero

This document summarizes the technical architecture, dependencies, state management, and next steps for the backend database integration of the **Tercio: Sangre y Acero** prototype.

---

## 1. Stack & Core Libraries

- **Framework**: Next.js App Router (using Turbopack development & optimized production build).
- **Styling**: Tailwind CSS v4 (configured inside `src/app/globals.css` with inline theme utilities).
- **Icons**: `lucide-react` (used for sidebar and resource badges).
- **State Management**: `zustand` with `persist` middleware (directing state to browser `localStorage`).
- **Icons / SVGs**: Custom inline vector SVGs for portrait and campaign illustrations to provide high-quality historical visuals without relying on external image endpoints.

---

## 2. Local-State Architecture

To ensure high-performance, real-time interactivity, and persistent gameplay between page refreshes in a mock environment (without hitting a real server database), all screens are connected to a client-side Zustand store located in:
- `src/lib/game-store.ts`

### Key Store Actions:
- `trainStat(stat)`: Deducts coins and XP, increases the selected stat, and adds fatigue.
- `buyItem(itemId)`: Deducts coins, adds item to the inventory, and updates the local state.
- `sellItem(itemId)`: Deducts item from the inventory, gives coins to the soldier.
- `equipItem(itemId)`: Places an item into the correct soldier slot (helmet, armor, boots, etc.).
- `unequipItem(slot)`: Clears an equipment slot and returns the item to active use.
- `startMission(missionId)`: Invokes the deterministic combat resolver (`src/lib/resolver.ts`), adds the mission's rewards (XP, honor, coins), appends fatigue, applies wounds or loot, generates a narrative text report, and records it.
- `treatWound(woundInstanceId)`: Deducts one clean bandage from the inventory and heals the selected open wound.

### Next.js Hydration Handling:
To avoid server-side pre-rendering mismatch (since `localStorage` is only available in the client browser), all pages employ a `mounted` state check and render a themed camp loading skeleton until the client loads the store state from the browser.

---

## 3. Routes Implemented

The following App Router endpoints were created and verified:
- `/` - Redirects to barracks.
- `/barracks` - Main camp dashboard. Shows soldier portraits, attributes, equipment list, wounds list, and links.
- `/soldier` - Soldier service record with tabbed sheets (Perfil, Rasgos, Historial, Progresión).
- `/training` - Training yards to level attributes.
- `/inventory` - Inventory macuto with search filters and equipment details side panel.
- `/equipment` - Redirects to inventory (with active equipment management).
- `/armory` - Supply store to buy picas, morriones, arcabuces, or bandages.
- `/missions` - Campaign maps with patrollers.
- `/missions/[id]` - Tactical briefings and deployment triggers.
- `/reports/[id]` - Parchment scrolls containing battle outcomes.
- `/hospital` - Field medical center to bandage bleeding wounds and rest in camastros to lower fatigue.

---

## 4. Next Steps: Database Integration

To shift this prototype from local-state mock storage into a production multiplayer RPG dashboard:
1. **Prisma Models**: The prepared PostgreSQL schema is ready in `prisma/schema.prisma` and matches our typescript models (`User`, `Soldier`, `SoldierStats`, `Equipment`, `InventoryItem`, etc.).
2. **Server Actions Migration**: Replace client store updates inside `game-store.ts` with calls to Server Actions (`src/lib/actions.ts`) that read and write directly to PostgreSQL via Prisma Client.
3. **Authentication**: Wrap layout with NextAuth or Supabase Auth to assign a `User` record to each player.
4. **Mission Timer**: Implement async workers to make missions take real-world time (e.g. 5 minutes) rather than instant resolution.
5. **ComfyUI Assets**: Swap SVG placeholders in `src/components/game/placeholder-art.tsx` with generated graphics loaded from `/public/assets` once the local ComfyUI asset pipeline finishes generation.
