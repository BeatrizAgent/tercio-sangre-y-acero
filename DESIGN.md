# DESIGN.md - Tercio: Sangre y Acero

> Norma de diseno para el proyecto. Este archivo es la fuente de verdad de
> medidas (px), grids y slots. Cuando un modelo genere disenos, mockups,
> assets o layout, **debe respetar** las cifras de aqui. Si un diseno
> necesita salirse, abrir debate en el repo, no improvisar.

## 0. Lienzo de referencia

- **Viewport base**: 1280x800 (laptop estandar).
- **Mockups de referencia** en `DESIGN/*.png`: **1672x941** (16:9). Usar
  como lienzo cuando se generen mockups nuevos, no escalar a 1280x800.
- **Escala tipografica**: 1rem = 17px (definido en `globals.css:62`).
- **Densidad de pantalla**: asume 1x. No aplicar Retina/2x en reglas de
  px, eso lo resuelve `next/image`.

## 1. Tokens visuales

### 1.1 Colores (CSS vars en `globals.css:3-23`)

| Token | Hex | Uso |
|---|---|---|
| `background` | `#1c1107` | fondo de pantalla |
| `panel` | `#2a1d12` | contenedor base |
| `panel-soft` | `#26190e` | paneles secundarios |
| `panel-raised` | `#35271c` | panel activo / hover |
| `parchment` | `#f4ecd8` | texto destacado, fondo de reportes |
| `parchment-dark` | `#d7c29a` | borde y overlay |
| `gold` | `#c9a24f` | titulos, bordes premium |
| `gold-soft` | `#ebc16a` | subtitulos |
| `iron` | `#3d352e` | bordes rigidos |
| `iron-light` | `#58413d` | hover de borde |
| `blood` | `#8a1f11` | boton primario |
| `blood-bright` | `#ffb4a7` | hover boton primario |
| `ember` | `#d16632` | fatiga, alertas calidas |
| `success` | `#5f8a55` | curado, OK |
| `warning` | `#c58b37` | aviso |
| `danger` | `#93000a` | herida abierta, error |
| `muted` | `#a78a85` | texto deshabilitado |
| `text` | `#f7decc` | cuerpo principal |
| `text-muted` | `#dfbfba` | cuerpo secundario |

### 1.2 Tipografia

- `font-cinzel` -> titulos, rangos, encabezados de card.
- `font-cormorant` -> reportes narrativos, citas, lore.
- `font-sans` (Inter) -> numeros, botones, labels funcionales.
- `font-blackletter` (UnifrakturCook) -> masthead del logo.
- Tamano body: **17px** (no 16). Sidebar: **10-11px**. Stat values: **18px**.

### 1.3 Sombras, radios y bordes

| Elemento | Valor |
|---|---|
| Drop-shadow assets/iconos | `0 4px 6px rgba(0,0,0,0.6)` |
| Drop-shadow medallones | `0 8px 18px rgba(0,0,0,0.4)` |
| Drop-shadow logo | `0 10px 18px rgba(0,0,0,0.55)` |
| Box-shadow paneles | `0 10px 26px rgba(0,0,0,0.42)` |
| Border-radius | `2px` paneles, `4px` game-panel, maximo **6px** |
| Border-width | **1-3px** siempre. No mas. |

## 2. Chrome del juego

### 2.1 Shell principal

- Contenedor: `max-w-[1080px]`, `mx-auto`, `bg-background`, `border border-iron`.
- Padding externo: `py-4 px-2` (sm) / `md:py-8` (md+).
- Marcos decorativos laterales: `w-8`, `bg-repeat-y`, opacidad 0.25,
  solo visibles en `xl:`.

### 2.2 Sidebar (navegacion)

| Elemento | Width | Height | Min | Max | Notas |
|---|---|---|---|---|---|
| Aside | 224 (w-56) / 240 (w-60) | `calc(100vh - 1.5rem)` | 224 | 240 | `md:w-56 md:max-h-[calc(100vh-1.5rem)]` |
| Aside padding | 8 | — | 8 | 12 | |
| Nav item | fill | 28 (h-7) / 32 (h-8) | 28 | 40 | `flex h-7` o `h-8` |
| Nav icon container | 20 / 24 | 20 / 24 | 20 | 32 | `h-5 w-5` / `h-6 w-6` |
| Nav icon interno | 14 / 16 | 14 / 16 | 14 | 20 | `h-3.5 w-3.5` / `h-4 w-4` |
| Nav label | fill | auto | 10px font | 11px font | `font-cinzel text-[10px]` o `10.5px` |
| Top tabs (City/Campaign) | fill | 32 | 32 | 40 | `h-8` |
| Tab icon | 14 | 14 | 14 | 18 | |

### 2.3 Topbar (command bar)

| Elemento | Width | Height | Min | Max | Notas |
|---|---|---|---|---|---|
| Header (top-command-bar) | fill | auto | 64 | 120 | padding `px-3 py-2` |
| Masthead grid | 3 cols | 84 | 64 | 100 | `minmax(220, 1.1fr) / minmax(280, 1.3fr) / minmax(280, 1.2fr)` |
| Titleplate (logo) | 1.1fr | fill | 56 | 84 | `max-h-[84px]` logo |
| Character card | 1.3fr | fill | 56 | 80 | padding 4px 6px |
| Resource rail | 1.2fr | fill | 56 | 80 | 3 sub-cols `repeat(3, minmax(0,1fr))` |
| Crest medallion (titleplate) | 54 | 54 | 40 | 64 | `h-[54px] w-[54px]` |
| Portrait thumb (char card) | 40 | 40 | 32 | 48 | `h-10 w-10` |
| Stat medallion (topbar) | 42 | 42 | 32 | 50 | small 32, default 42, large 50 |
| Stat icon (Lucide) | 24 | 24 | 20 | 28 | `h-6 w-6` con `stroke-width: 1.8` |
| Action button | fill | 34 | 34 | 48 | `min-h-[34px]` full width |
| Topbar padding | — | 5-7 | 5 | 7 | padding botones |

### 2.4 Main viewport

- `flex-1 w-full min-w-0`.
- Padding interno: controlado por la pagina (no global).
- Loading fallback: `min-h-[50vh]`, spinner 40x40.

### 2.5 Breakpoints

| sm | md | lg | xl | 2xl | custom media |
|---|---|---|---|---|---|
| 640 | 768 | 1024 | 1280 | 1536 | `@media (max-width: 900px)`, `@media (max-width: 640px)` en `globals.css:1392,1402` |

Reglas:
- Por debajo de 640: sidebar colapsa a top-tabs horizontales, topbar
  recorta tarjetas.
- Por debajo de 900: topbar panels no esenciales se ocultan.
- `xl:` activa marcos verticales decorativos del shell.
- En `xl` el shell se queda en `max-w-[1080px]` (no crece con el
  viewport). Esto es intencional: el juego es denso, no quiere
  estiurse.

## 3. Grids y slots por pantalla

### 3.1 `/soldier` (Hoja de servicio)

- Layout principal: `md:grid-cols-[1.1fr_0.9fr]` (sprite + datos).
- Sub-grid role-tabs: `grid-cols-2 sm:grid-cols-5`, gap 6.
- Character sprite preview: contenedor 264x264 (sm: 280x280), padding 12.
- Sprite sheet canvas: 100% del contenedor.
- Equipment mannequin:
  - Wrapper: **264x264** (sm 280x280), padding 12, border 1px iron.
  - Grid: **3x3**, `gap: 8px`.
  - Slot individual: **64x64** (sm **68x68**), border 1px iron/dashed.
- Profile role tabs (modo normal): `min-h-14`, padding 6 vertical.
- Profile role tabs (compact): `min-h-12`, padding 4.

### 3.2 `/inventory` (cofre del jugador)

- Grid fijo: **8 columnas x 5 filas**.
- Celda: **56x56** px.
- Gap: **4px**.
- Padding interno del grid: **4px**.
- **Ancho total**: 8*56 + 7*4 + 8 = **492px**.
- **Alto total**: 5*56 + 4*4 + 8 = **304px**.
- Slot vacio: dashed border, opacidad 0.3, icono Lucide 20x20.

### 3.3 `/armory` (vendedor)

- Grid fijo: **8 columnas x 4 filas**.
- Celda: **40x40** px.
- Gap: **4px**.
- Padding interno: **4px**.
- **Ancho total**: 8*40 + 7*4 + 8 = **356px**.
- **Alto total**: 4*40 + 3*4 + 8 = **180px**.
- NpcOfferFrame (cabecera del vendedor):
  - Container: `min-h-[340px]`, padding 12-16.
  - Sub-grid: `md:grid-cols-[210px_minmax(0,1fr)]`, gap 12.
  - Portrait: `h-full min-h-72 w-full object-cover object-top`.
  - Tile oferta: `min-h-16` (64px), icon 36-40px, value 11px mono.

### 3.4 `/equipment` (maniqui)

> Vista independiente en construccion. Mismas medidas que el
> maniqui embebido en `/soldier`. Ver 3.1.

### 3.5 `/training`

- Layout: `md:grid-cols-[1fr_1.05fr]`, gap 24.
- Scene frame: `min-h-40` (160px) en sm, hasta 240 en md.
- Stat rows: `min-h-20` (80px) cada fila, padding 8.
- Action button: `min-h-10` full width, padding 12 horizontal, font
  10-11px mono uppercase.
- Progress bar: `h-full`, fill width porcentual.
- Fatigue bar: `h-2` o `h-3`, full width del row.

### 3.6 `/missions` (mapa de campana)

- Region tabs: `h-12` o `h-14`, icon 48-56 (`h-12 w-12` sm / `md:h-14 md:w-14`).
- Mission list: `gap-2`, items `min-h-14`.
- Difficulty badge: `min-w-10`, padding 8 horizontal.
- Action footer: `min-h-9`, full width, font 10-11px.

### 3.7 `/missions/[id]` (detalle)

- Layout: `md:grid-cols-[1.55fr_1fr]`, gap 20.
- Scene frame: `h-[360px]` (fijo), padding 16, overlay grid `grid-cols-2 lg:grid-cols-4`.
- Stat row (debajo de scene): `sm:grid-cols-4`, gap 12.
- Modifiers grid: `grid-cols-5`, gap 8.
- Modifiers chips: `min-h-[72px]`, padding 6.
- Reward cards: `grid-cols-4`, gap 8, item con icono 32-40px.

### 3.8 `/hospital` (cirujano)

- Layout: `lg:grid-cols-[2fr_1.1fr]`, gap 24.
- Scene frame: `min-h-56` (224px), padding 20-28.
- Treatment actions: `sm:grid-cols-2`, gap 12.
- Surgeon portrait: 160x160 max.

### 3.9 `/reports/[id]` (reporte animado)

- Modal: `max-w-5xl` (1024px), w-full.
- Stage: `min-h-[660px]`, en lg `min-h-[640px]`.
- Battle line (tercio): 3-4 roles, token individual `min-w-[120px] h-24`.
- Rol header: `max-w-[170px]`, font 10px mono.
- Reward tile: 220x320 max, padding 12-16.
- Coin rain overlay: 100% x 100%, z-index alto.

### 3.10 `/recruitment` (reclutar soldados)

- Card: `min-w-0`, padding 10, border 1px iron.
- Header: `gap-2.5`, portrait 40-48px, role icon 16-20.
- Skills grid: `grid-cols-4 gap-1` (4 stats) o `grid-cols-3 gap-1` (3 stats).
- Action button: `min-h-9`, padding 12 horizontal, font 10-11px.

### 3.11 `/company` (tercio / formation)

- Layout principal: `lg:flex-row`, `lg:min-h-[610px]`.
- Field canvas: `min-h-[660px]` (sm) / `min-h-[640px]` (lg), flex-1.
- Formacion columns: `min-h-[86px]`, padding 8, gap 6 vertical.
- Token card: `min-w-[120px] h-24`, max-w 104 (header).
- Header rol: `max-w-[220px]`, font 10px.
- Tooltip absoluto: `z-40`, `max-w-[220px]`, padding 8, font 10px mono.

### 3.12 Slots del maniqui (referencia, no pantalla propia)

`equipment-mannequin.tsx:9-24`:

```
row 0: head (col 1)          | accessory (col 2)
row 1: mainHand (col 0)      | body (col 1)   | offHand (col 2)
row 2: firearm (col 0)       | boots (col 1)   | consumable (col 2)
```

Slots vacios rellenan con icono Lucide `Shield` 20x20, opacidad 0.3.

## 4. Canvas PIXI (visuales animados)

| Uso | Width | Height | Min | Max | Notas |
|---|---|---|---|---|---|
| Combat modal | 100% main | 660 | 600 | 1024 | `max-w-5xl` |
| Battle line (tercio) | flex-1 | 660 lg / 640 lg | 600 | 720 | `min-h-[660px]` |
| Sprite preview | fill parent | 264 | 192 | 320 | `min-h-48` minimo absoluto |
| Enemy portrait | fill scene | 360 | 240 | 480 | mission detail |
| Scene (mapa) | fill | 360 | 240 | 480 | `h-[360px]` |
| Coin rain | 100% | 100% | — | — | absolute overlay |
| Effect overlay | 100% | 100% | — | — | z-index > tokens |

Reglas canvas:
- El canvas PIXI **no controla el layout**; lo envuelve un host div
  con `width: 100%; height: 100%`.
- Animaciones: estados `idle | walk | attack | hurt | dead` por
  sprite.
- Transiciones: 300ms ease-out (ver `page-transition.tsx`).
- El canvas solo se usa para: previsualizacion de avatar, duelo,
  reporte animado, mapa, banners, efectos. **No** para navegacion,
  botones, dialogos.

## 5. Reglas de assets (PNG a generar)

| Categoria | Tamano px | Aspecto | Fondo | Notas |
|---|---|---|---|---|
| Mockup referencia | 1672x941 | 16:9 | opaco | lienzo actual |
| Iconos UI | 512x512 o 768x768 | 1:1 | transparente | lectura 24/32/48 |
| Iconos sidebar | 512x512 o 768x768 | 1:1 | transparente | mismo encuadre y luz |
| Iconos recurso/estado | 256x256 o 512x512 | 1:1 | transparente | lectura 24/32/48 |
| Iconos accion | 512x512 | 1:1 | transparente | misma direccion de luz |
| Marcos 9-slice | 192x192 | 1:1 | transparente | tileable, esquinas iguales |
| Sprites Diego idle 3/4 | 1086x1448 | 3:4 | transparente | `globals.css` ya referencia 1086x1448 |
| Sprites Diego sheets | 1024x1536 base, N frames en grid | 3:4 | transparente | cuadricula uniforme |
| Sprites enemigos | misma altura visual que Diego | 3:4 | transparente | cuerpo completo o 3/4 |
| Retratos | 1024x1024 o 1086x1448 | 1:1 o 3:4 | opaco | `object-top` |
| Fondos de pantalla | 1920x1080 min | 16:9 | opaco | espacio negativo a derecha/centro |
| Escenas de evento | 1920x1080 | 16:9 | opaco | `mature:true` con `presentation:blurred` si aplica |
| Texturas tileable | 1024x1024 o 2048x2048 | 1:1 | opaco | opacidad controlable en CSS |

Reglas de estilo:
- Estilo pictorico/realista, **no pixel art**.
- Luz calida, metal oscuro, borde dorado suave.
- Sin texto dentro del icono.
- Sin anime, sin fantasy, sin glow exagerado.
- SFW absoluto: sin gore explicito, sin contenido sexualizado.
- Materiales historicos: morion, coraza, pica, arcabuz, cuchilla,
  botas, cuero, pergamino, madera oscura, hierro remachado.

## 6. Convenciones

- **UI en espanol** (etiquetas, botones, mensajes). Ej: "Barracones",
  "Entrenar", "Reclutar".
- **Codigo y clases en ingles** (variables, props, archivos).
- Archivos de asset slugificados en `snake_case_ascii` (ver
  `scripts/rename_asset_stems.py`).
- Tono narrativo: barro, acero, humo de polvora, pagas retrasadas,
  disciplina dura. **Evitar**: frases de MMO generico, jerga moderna
  en texto in-game, tono de "heroe elegido".
- Borde por defecto: **1px**. Solo el panel-raised usa 2px. Ningun
  borde > 3px.
- Sombra por defecto: blur 4-12px, opacidad 0.3-0.6. Ninguna sombra
  halo azulada o neones.
- Iconos UI dedicados primero; **Lucide solo como fallback** en
  sidebar y tooltips.

## 7. Anti-patrones (lo que NO hacer)

- **No** llenar el sidebar a mas de 8 entradas visibles sin scroll.
- **No** usar drop-shadow > 12px ni halo azul/morado.
- **No** introducir fuentes fuera de Cinzel, Cormorant, Inter,
  UnifrakturCook.
- **No** esquinas > 6px (rompe la estetica de panel de madera).
- **No** grid de mas de 12 columnas en main content.
- **No** boton primario de color que no sea `blood` o `iron` realzandose
  a `gold`.
- **No** emoji, no iconos modernos de redes, no simbolos fuera de
  Lucide o del banco de assets.
- **No** glow animado, no parpadeo, no blink en elementos criticos.
- **No** canvas PIXI para navegacion, botones o dialogos: el canvas
  es solo para visuales animados.
- **No** Tailwind sin semantica: usar las clases `game-panel`,
  `parchment-card`, `iron-button`, `blood-button`, `stat-bar`,
  `equipment-slot` ya definidas en `globals.css`.
- **No** mockup fuera de 1672x941 ni fuera del estilo pictorico/realista
  ya fijado.
- **No** responsive que rompa el layout en < 640px sin testear el
  fallback mobile (sidebar colapsado, topbar recortado).
- **No** luces o paletas tipo fantasy (azules magicos, purpuras de
  mago, dorados excesivos de MMO). El mundo es barro, acero, sangre
  seca, pergamino, oro contenido.

## 8. Resumen rapido (cheat sheet para el modelo)

```
viewport base     = 1280 x 800
shell max-width   = 1080
sidebar           = 224-240 x 100vh-24
topbar logo       = max-h 84
crest             = 54 x 54
medallion         = 42 x 42 (small 32, large 50)
stat icon         = 24 x 24
nav item          = fill x 28-32
slot equipo       = 64-68 x 64-68
maniqui           = 264-280 x 264-280
cofre jugador     = 492 x 304 (8x5, cell 56)
cofre vendedor    = 356 x 180 (8x4, cell 40)
scene frame       = 240-360 alto
combat modal      = 100% x 660 (min 600, max 1024)
formation token   = 120 x 96
font body         = 17px
font sidebar      = 10-11px
font stat value   = 18px mono
border            = 1-3px
radius            = 2-4px (max 6)
icon UI png       = 512-768
sprite png        = 1086 x 1448 (base 3/4)
mockup png        = 1672 x 941
fondo png         = 1920 x 1080 min
```
