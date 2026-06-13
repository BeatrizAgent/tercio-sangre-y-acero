# Design System - Tercio: Sangre y Acero

This document outlines the visual guidelines, typography, color palettes, and layout rules for the **Tercio: Sangre y Acero** dashboard client interface.

---

## 1. Visual Direction & Tone

The interface is built to evoke the muddy, gritty, and steel-clad realities of 17th-century Spanish campaigns:
- **Atmosphere**: Mud, steel, powder smoke, wet boots, harsh military discipline.
- **Visuals**: Dark charcoal backgrounds, aged parchment cards, sturdy iron borders, muted gold details, and dried crimson (blood) button accents.
- **Aesthetics**: Premium, dense browser-game dashboard. Avoid clean modern flat colors or futuristic borders. Ensure panels feel tactile and layered.

---

## 2. Color Palette

The global colors are defined as CSS variables inside `globals.css` and mapped to Tailwind colors:

| Token | CSS Variable Value | Purpose |
|---|---|---|
| `background` | `#090806` | Main screen backdrop (dark charcoal) |
| `panel` | `#15110d` | Game panel base color (dark aged wood/leather) |
| `panel-soft` | `#1d1711` | Secondary panels and grids |
| `panel-raised` | `#241b13` | Highlighted active panels |
| `parchment` | `#d7c29a` | Text/icon highlight and card accent |
| `parchment-dark`| `#a78b5f` | Border and backdrop overlay for reports |
| `gold` | `#c9a24f` | Titles, borders, and premium accents (gold) |
| `gold-soft` | `#e0c47a` | Secondary text headings |
| `iron` | `#3b3832` | Sturdy borders and dividing lines |
| `iron-light` | `#5a5448` | Hover highlights for borders |
| `blood` | `#8f1f1f` | Primary button base color (crimson red) |
| `blood-bright` | `#b83232` | Primary button hover color |
| `ember` | `#d16632` | Fatigue indicator and warm highlights |
| `success` | `#5f8a55` | Valid statuses, healed wounds |
| `danger` | `#b3342d` | Open wounds, low currency alerts |
| `text` | `#f3ead7` | Primary body text (warm off-white) |
| `text-muted` | `#b8a98d` | Secondary body labels and description text |

---

## 3. Typography

Three distinct Google Fonts are loaded via `next/font/google`:

- **Cinzel** (`--font-cinzel`, serif):
  - Used for: Logo headings, screen titles, rank names, and primary card headers.
  - Tone: Classic, authoritative, historical.
- **Cormorant Garamond** (`--font-cormorant`, serif, italic):
  - Used for: Parchment documents, narrative reports, quotes, and lore text.
  - Tone: Handwritten, organic, manuscript-like.
- **Inter** (`--font-inter`, sans-serif):
  - Used for: Numbers, stat values, buttons, labels, and functional dashboard data.
  - Tone: Highly legible, modern, numeric clarity.

---

## 4. Reusable Styles

The design system implements several custom utility classes in `globals.css`:

1. **`game-panel`**:
   - Creates a dark wood/leather container with an inset shadow and subtle inner border lines.
2. **`parchment-card`**:
   - Emulates a physical sheet of paper with warm yellow-cream gradients, detailed borders, and a sepia/brown ink font. Used for mission reports.
3. **`iron-button`**:
   - A dark, metal-looking button with a gray-brown gradient, turning gold-trimmed on hover. Used for secondary actions.
4. **`blood-button`**:
   - A rich dark-red button that glows brighter red on hover. Used for primary loop actions (like resolving missions or buying equipment).
5. **`stat-bar`**:
   - A clean health-bar-like wrapper. Fill lines can be crimson red (`stat-bar-fill`) or gold (`stat-bar-fill-gold`).
6. **`equipment-slot`**:
   - A dashed-border box that serves as a drag/click slot for helmets, armor, pikes, and boots.

---

## 5. Layout Grid

The viewport is organized as:
1. **Top Resource Bar**: A fixed-height top bar displaying name, rank, coins (doblones), honor, experience, and fatigue.
2. **Sidebar Navigation**: Fixed left-side vertical menu containing navigation links with Spanish historical labels and Lucide icons.
3. **Main Content Canvas**: Fills the remaining space, structured as a two-column responsive grid (main page actions on the left, status and contextual advice on the right).
