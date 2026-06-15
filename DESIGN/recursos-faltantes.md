# Recursos faltantes para clonar el DESIGN

Fecha: 2026-06-14

Estado actual:

- Pantallas de referencia en `DESIGN`: 7 PNG (`menu_principal`, `inventario`, `armeria`, `entrenamiento`, `misiones`, `hospital`, `reportes`).
- Banco visual indexado: 328 assets en `data/assets.json`.
- Referencias rotas en datos de juego: 0.
- Iconos UI existentes: 29 PNG en `GPT-ASSETS/icons-ui`.

La falta principal no es cantidad de assets. La falta es material especifico para reproducir el mockup con precision: sprites de personaje, iconos UI dedicados, fondos de panel, ornamentos, estados y componentes visuales exportables.

## Prioridad alta

### 1. Iconos UI exactos del sidebar

Necesario para que el menu lateral coincida con el DESIGN sin reutilizar iconos parecidos.

- `icon_sidebar_cuartel.png`: casco/morion o tienda de campamento.
- `icon_sidebar_soldado.png`: busto de soldado.
- `icon_sidebar_entrenar.png`: espadas cruzadas.
- `icon_sidebar_inventario.png`: mochila/cofre.
- `icon_sidebar_equipo.png`: coraza o escudo.
- `icon_sidebar_armeria.png`: martillo + arma.
- `icon_sidebar_misiones.png`: bandera/mapa.
- `icon_sidebar_hospital.png`: mortero/cruz/cirujano.

Formato recomendado:

- PNG transparente.
- 512x512 o 768x768.
- Mismo encuadre, misma escala visual.
- Luz calida, metal oscuro, borde dorado suave.
- Sin texto dentro del icono.

### 2. Sprite/avatar base del soldado

Necesario para perfil, equipo y futuro preview de combate.

- `sprite_diego_idle_front.png`
- `sprite_diego_idle_3q.png`
- `sprite_diego_walk_sheet.png`
- `sprite_diego_attack_pike_sheet.png`
- `sprite_diego_attack_sword_sheet.png`
- `sprite_diego_hurt.png`
- `sprite_diego_defeated.png`

Formato recomendado:

- PNG transparente.
- Sheet con cuadricula uniforme.
- Estilo realista/pintado, no pixel-art si el DESIGN sigue siendo pictorico.
- Version limpia y version con barro/sangre leve SFW.

### 3. Siluetas o sprites de enemigos

Necesario para misiones y preview de duelo sin depender solo de retratos.

- `sprite_enemy_bandit_idle.png`
- `sprite_enemy_french_idle.png`
- `sprite_enemy_protestant_idle.png`
- `sprite_enemy_italian_idle.png`
- `sprite_enemy_moor_idle.png`
- `sprite_enemy_turk_idle.png`

Formato recomendado:

- PNG transparente.
- Cuerpo completo o 3/4.
- Misma altura visual que Diego.
- Variantes SFW, sin gore explicito.

### 4. Fondos especificos de pantalla

Ya existen fondos buenos, pero faltan algunos encuadres mas parecidos al DESIGN: mas oscuros, panoramicos y con espacio libre para UI.

- `screen_bg_menu_principal.png`
- `screen_bg_inventario.png`
- `screen_bg_equipo.png`
- `screen_bg_reportes.png`
- `screen_bg_rankings_future.png`
- `screen_bg_company_future.png`

Formato recomendado:

- 1920x1080 minimo.
- Version oscura usable detras de paneles.
- Sin texto.
- Espacio negativo a derecha/centro para cards.

## Prioridad media

### 5. Marcos y placas UI exportables

Ahora se recrean con CSS. Para parecer mas al DESIGN faltan piezas visuales reutilizables.

- `ui_panel_frame_dark_9slice.png`
- `ui_panel_frame_gold_9slice.png`
- `ui_nav_item_idle_9slice.png`
- `ui_nav_item_active_9slice.png`
- `ui_topbar_plate_9slice.png`
- `ui_resource_badge_9slice.png`
- `ui_button_primary_9slice.png`
- `ui_button_danger_9slice.png`
- `ui_slot_empty_9slice.png`
- `ui_item_card_9slice.png`

Formato recomendado:

- PNG transparente.
- Preparado para 9-slice.
- Bordes sutiles de 1px a 3px.
- Sin sombras enormes, para no ensuciar texto.

### 6. Ornamentos y separadores

Faltan detalles pequenos del mockup: remaches, lineas, esquinas, separadores y florituras.

- `ui_corner_gold_tl.png`, `ui_corner_gold_tr.png`, `ui_corner_gold_bl.png`, `ui_corner_gold_br.png`
- `ui_divider_gold_short.png`
- `ui_divider_gold_long.png`
- `ui_rivet_iron.png`
- `ui_rivet_gold.png`
- `ui_wax_seal_blood.png`
- `ui_banner_small_burgundy_cross.png`

Formato recomendado:

- PNG transparente.
- Variantes claras/oscuras.
- Tamano pequeno, optimizado para UI.

### 7. Iconos de recursos y estados

Hay iconos UI, pero faltan versiones dedicadas para HUD y estados.

- `icon_resource_coins.png`
- `icon_resource_honor.png`
- `icon_resource_xp.png`
- `icon_resource_fatigue.png`
- `icon_resource_wages_unpaid.png`
- `icon_status_wound.png`
- `icon_status_disease.png`
- `icon_status_banished.png`
- `icon_status_corruption.png`
- `icon_status_reputation.png`

Formato recomendado:

- PNG transparente.
- 256x256 o 512x512.
- Lectura clara a 24px, 32px y 48px.

### 8. Iconos de acciones

Necesario para botones y acciones sin depender solo de Lucide.

- `icon_action_train.png`
- `icon_action_buy.png`
- `icon_action_sell.png`
- `icon_action_equip.png`
- `icon_action_unequip.png`
- `icon_action_start_mission.png`
- `icon_action_rest.png`
- `icon_action_treat_wound.png`
- `icon_action_read_report.png`
- `icon_action_collect_reward.png`

Formato recomendado:

- PNG transparente.
- Misma direccion de luz.
- Mismo grosor visual.

## Prioridad baja

### 9. Variantes de retrato por estado

Mejora perfil, reportes y hospital.

- `portrait_diego_neutral.png`
- `portrait_diego_tired.png`
- `portrait_diego_wounded.png`
- `portrait_diego_proud.png`
- `portrait_diego_defeated.png`
- `portrait_sergeant_angry.png`
- `portrait_armorer_neutral.png`
- `portrait_surgeon_neutral.png`
- `portrait_chaplain_neutral.png`

### 10. Escenas de evento adicionales

Cubren reportes y eventos duros con politica SFW.

- `event_delayed_pay.png`
- `event_camp_argument.png`
- `event_broken_pike.png`
- `event_rain_march.png`
- `event_tavern_tension.png`
- `event_field_surgery_indirect.png`
- `event_burial_silhouette.png`
- `event_burned_supplies.png`

Regla:

- Sin gore explicito.
- Si es duro, usar encuadre indirecto, humo, vendas, siluetas o objetos.
- Marcar en asset bank con `mature: true` y `presentation: "blurred"` si aplica.

### 11. Texturas base de interfaz

Ayudan a que todos los paneles compartan materia visual.

- `texture_dark_wood_panel.png`
- `texture_blackened_iron.png`
- `texture_worn_leather.png`
- `texture_old_parchment.png`
- `texture_smoke_overlay.png`
- `texture_grime_overlay.png`

Formato recomendado:

- Tileable cuando sea textura.
- 1024x1024 o 2048x2048.
- Opacidad controlable en CSS.

## Recursos que ya cubren mucho

- Equipo/inventario: `GPT-ASSETS/armadura`, `GPT-ASSETS/armas`, `GPT-ASSETS/otros`.
- Fondos principales: `GPT-ASSETS/CG/cg_events`.
- Retratos: `GPT-ASSETS/CG/portraits`.
- Enemigos: `GPT-ASSETS/enemigos`.
- Iconos UI base: `GPT-ASSETS/icons-ui`.

## Como registrar nuevos recursos

Despues de meter nuevos PNG en `GPT-ASSETS`, ejecutar:

```text
python scripts/process_gpt_assets.py --commit
python scripts/build_asset_bank.py
python tests/validate_asset_bank.py
```

Luego enlazar en datos o codigo con:

- `assetId`
- `portraitAssetId`
- `sceneAssetId`

## Checklist minimo para la siguiente ronda

- [ ] 8 iconos exactos de sidebar.
- [ ] 5 iconos exactos de recursos/estado.
- [ ] 1 sprite base de Diego idle 3/4.
- [ ] 1 sheet simple de Diego ataque.
- [ ] 3 sprites enemigos cuerpo completo.
- [ ] 4 marcos 9-slice: panel, nav idle, nav active, resource badge.
- [ ] 2 fondos faltantes: equipo y reportes.
- [ ] 1 textura tileable oscura para paneles.
