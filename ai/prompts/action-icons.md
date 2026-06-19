# Action Icon Prompts

Manual ChatGPT prompt batch for action button glyphs. Save outputs into
`GPT-ASSETS/ui/action/`. Ten icons total.

## Base style

Centered, single-subject painterly glyph, 256x256 PNG, early modern
Spanish tercio era, isolated object on flat magenta background, no
text, no modern gear, no fantasy ornament. Readable at 24 px.

## Negative style

No text inside the icon. No glow. No busy background. No
fantasy runes. Keep silhouette readable on dark and light panels.
Stroke weight must match the sidebar icon set.

## Output contract

- 256x256 PNG minimum.
- Subject fills about 60 percent of the canvas.
- Magenta background for the cleanup script.
- After saving all ten, run:
  ```text
  python scripts/process_gpt_assets.py --commit
  python scripts/build_asset_bank.py
  python tests/validate_asset_bank.py
  ```

## Per-icon prompts

1. `icon_action_train.png` — Pike shaft thrust upward through a wooden
   drill ring, no text.
2. `icon_action_buy.png` — Open hand offering coins toward a small
   open chest, no text.
3. `icon_action_sell.png` — Small open chest with coins spilling over
   its edge toward an open hand, no text.
4. `icon_action_equip.png` — Brigantine cuirass with leather
   shoulder straps lifted by a pair of hands, no text.
5. `icon_action_unequip.png` — Brigantine cuirass lowered off a
   wooden stand, no text.
6. `icon_action_start_mission.png` — Folded map with a single
   charcoal mark and a wooden pointer, no text.
7. `icon_action_rest.png` — Folded camp blanket on a straw mat with a
   leather cap set aside, no text.
8. `icon_action_treat_wound.png` — Linen bandage strip being
   unrolled beside a clay jar, no text.
9. `icon_action_read_report.png` — Single sheet of parchment with a
   wax seal, rolled corners, no readable text.
10. `icon_action_collect_reward.png` — Coin purse on a wooden
    table, the knot being drawn open, no text.

## Mature SFW variant

None of the action icons depict harm directly. For treating wounds,
keep the bandage neutral; do not show blood or open flesh.
