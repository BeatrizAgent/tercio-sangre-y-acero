# UI 9-Slice Frame Prompts

Manual ChatGPT prompt batch for reusable UI frames. Save outputs into
`GPT-ASSETS/ui/frames/`. Ten frames total. Each is a flat 9-slice tile
designed for CSS `border-image` reuse.

## Base style

Painterly 9-slice texture tile, 192x192 PNG, early modern Spanish
tercio era, dark iron panel base, restrained warm gold inner border,
subtle 1-3 px bevel, transparent center if requested, no text, no
modern, no fantasy, no glow.

## Negative style

No drop shadow. No busy center. No text. No gradient. No fantasy
rune. No watermark. The center must remain clean so content can
sit on top.

## Output contract

- 192x192 PNG, transparent center unless noted.
- All four corners must match so the slice seams disappear.
- Sides must tile horizontally/vertically without seams.
- Save with magenta background only when the cleanup script must
  remove it. For 9-slice assets prefer **transparent** from the start
  to avoid edge artifacts.

## Per-frame prompts

1. `ui_panel_frame_dark_9slice.png` — Dark iron panel, restrained
   warm gold inner bevel, transparent center.
2. `ui_panel_frame_gold_9slice.png` — Brighter warm gold panel, dim
   iron inner bevel, transparent center.
3. `ui_nav_item_idle_9slice.png` — Slim dark iron nav bar at rest,
   warm gold edge, transparent center.
4. `ui_nav_item_active_9slice.png` — Same shape with brighter warm
   gold edge and a thin red accent line, transparent center.
5. `ui_topbar_plate_9slice.png` — Wider top bar plate, dim iron
   with rivets, warm gold underline, transparent center.
6. `ui_resource_badge_9slice.png` — Small rounded resource chip
   frame, dark iron, warm gold edge, transparent center.
7. `ui_button_primary_9slice.png` — Primary action button frame,
   dark iron, warm gold border, transparent center.
8. `ui_button_danger_9slice.png` — Danger button frame, dark iron,
   dim red inner border, warm gold edge, transparent center.
9. `ui_slot_empty_9slice.png` — Empty equipment slot frame, dim
   iron, faint diagonal cross hint, transparent center.
10. `ui_item_card_9slice.png` — Inventory card frame, dark iron,
    warm gold edge, transparent center.

## Mature SFW variant

All frames are pure UI chrome. No variant required.
