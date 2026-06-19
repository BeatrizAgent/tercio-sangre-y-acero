# Resource and Status Icon Prompts

Manual ChatGPT prompt batch for HUD resource and status glyphs. Save
outputs into `GPT-ASSETS/ui/resource/`. Ten icons total: five resource
counters and five status effects.

## Base style

Centered, single-subject painterly glyph, 256x256 PNG, early modern
Spanish tercio era, isolated object on flat magenta background, no
text, no frame, no modern gear, no fantasy ornament. Readable at
24 px, 32 px, and 48 px.

## Negative style

No text. No glow, no halo. No gradient. No busy background. No
fantasy runes. No modern symbol. No drop shadow. Keep the silhouette
legible on a dark panel and on a light panel.

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

### Resources (counter chips)

1. `icon_resource_coins.png` — Stacked copper maravedies beside a single
   gold ducat, on dark cloth, no text.
2. `icon_resource_honor.png` — Polished bronze cross of Burgundy,
   patinated, on dark cloth, no text.
3. `icon_resource_xp.png` — Rolled parchment with a wax seal, on dark
   cloth, no text.
4. `icon_resource_fatigue.png` — Empty leather wine-skin draped on a
   peg, on dark cloth, no text.
5. `icon_resource_wages_unpaid.png` — Leather coin pouch with a
   frayed knot and a single slipping coin, on dark cloth, no text.

### Status (effect chips)

6. `icon_status_wound.png` — Linen bandage strip with a faint red
   stain, painterly, no text.
7. `icon_status_disease.png` — Mortar bowl with a pestle and
   dried herb sprig, painterly, no text.
8. `icon_status_banished.png` — Broken wooden stamp with a discarded
   paper fragment, painterly, no text.
9. `icon_status_corruption.png` — Small leather purse with a cracked
   wax seal, dark stain, painterly, no text.
10. `icon_status_reputation.png` — Heraldic shield blank painted in
    flat iron-grey, painterly, no text.

## Mature SFW variant

Harsh status icons (wound, disease, banished) use indirect
imagery: stained cloth, broken tools, discarded objects. No gore. No
bodily fluids shown. Mark linked data with `mature: true` and
`presentation: "blurred"` in `data/`.
