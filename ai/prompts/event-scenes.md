# Event Scene Prompts

Manual ChatGPT prompt batch for the additional event scenes listed
in [DESIGN/recursos-faltantes.md](../../../DESIGN/recursos-faltantes.md)
section 10. Save outputs into `GPT-ASSETS/CG/sprites_events/`.
Eight scenes total. The folder is shared with the existing event
sprites; use the `event_*.png` filename prefix to keep the rename
map deterministic.

## Base style

Wide painterly event scene, 1280x720 minimum, early modern Spanish
tercio era, indirect composition, muted palette, no text, no modern
gear, no fantasy, no readable text on banners or documents.

## Negative style

No gore. No bodily fluids. No explicit wounds. No weapons
embedded in bodies. No screaming faces. Use indirect composition:
silhouettes, smoke, broken gear, covered bodies, stained ground,
tension in posture.

## Output contract

- 1280x720 PNG minimum.
- Magenta background for the cleanup script.
- After saving all eight, run:
  ```text
  python scripts/process_gpt_assets.py --commit
  python scripts/build_asset_bank.py
  python tests/validate_asset_bank.py
  ```
- Mark linked data with `mature: true` and
  `presentation: "blurred"` in `data/events.json`.

## Per-scene prompts

1. `event_delayed_pay.png` — Empty coin chest with a single
   officer's back turned, no faces shown, no text.
2. `event_camp_argument.png` — Two silhouettes facing off in
   torchlight, no weapons drawn, no text.
3. `event_broken_pike.png` — A pike shaft splintered over a
   knee, discarded on muddy ground, no text.
4. `event_rain_march.png` — Marching pike tips disappearing
   into heavy rain, no faces shown, no text.
5. `event_tavern_tension.png` — A spilled cup and a chair
   tipped over, dim lantern, no faces, no text.
6. `event_field_surgery_indirect.png` — Surgeon's back bent
   over a covered form, lantern light, no blood, no faces
   shown, no text.
7. `event_burial_silhouette.png` — Three figures standing
   around a fresh mound of earth, distant bell silhouette,
   no faces, no text.
8. `event_burned_supplies.png` — Smoldering supply cart with
   blackened canvas, no bodies, no text.
