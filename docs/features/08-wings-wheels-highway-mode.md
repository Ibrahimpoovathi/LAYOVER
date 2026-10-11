# 08 — WINGS ⇄ WHEELS: Highway Mode & the Old Bus Ticket

> **Feature doc · LAYOVER v3** (supersedes the v2 mode engine in `07-transport-modes.md`) · built during LAYOVER 2026 hackathon night
> Status: ✅ LIVE — WINGS (air) and WHEELS (bus + train) both golden-path verified in browser.

## TL;DR

The app became a **two-world travel machine**. One flip of the `WINGS ⇄ WHEELS` switch:

- **WINGS** (internal id `air`) — the amber night terminal. Boarding pass, `BED → DXB`, gate announcements. Untouched except renames.
- **WHEELS** (internal id `road`) — a **complete skin swap**: bitumen dark-green background, green highway-guide-sign panels (`.sign-panel`), hazard-yellow primary, "HIGHWAY ADVISORY" board, journey form (`FROM → TO` + `BUS/TRAIN` toggle) — and the boarding pass is replaced by a **vintage old bus ticket** (`BusTicketCard`) with conductor punch-holes.
- **Stamps are untouched** — same categories, same slam, same DB. The ticket panel literally says "YOUR TICKET IS YOUR PASSPORT".
- WHEELS plans **journeys**, not stops: missions span the ride (boarding → on board → meal halt → arrival).

## Why it exists (rubric tie)

- **Travel connection (10)**: hackathon opened to travel in general — buses and trains are THE dead-hour experience of Kerala. A 10-hour KSRTC ride is a layover on wheels.
- **Creativity (10)**: the WINGS→WHEELS flip is the demo moment; the bus ticket with punch-holes is the photo artifact.
- **Built (20) / Execution (5)**: both worlds share one mission engine, one DB, one fallback chain — no duplicated systems to break at 7 AM.

## Files

| File | Change |
|---|---|
| `src/lib/plan-schema.ts` | +`VEHICLES`/`VehicleId`/`VEHICLE_META`; planSchema +`vehicle`, +`destination`, +`routeCode`, +`fareJoke` (all optional — air plans validate unchanged) |
| `src/lib/modes.ts` | `MODE_META` rebranded: labels WINGS/WHEELS, hero texts, `subline`, `plannerHeading`, `controlLabel`, `buttonLabel`, `durationLabel`, `footerLine` |
| `src/lib/airports.ts` | +`StopKind` (`airport|bus|train|halt`); +8 railway stations (CLT, ERS, TVC, SBC, MAS, CSMT, HWH, SC); `searchAirports(query, limit, { mode, vehicle, excludeIata })` — vehicle kinds float to top |
| `src/lib/demo-mode.ts` | +`WHEELS_DEMO_JOURNEYS` (KBS>MJS bus/foodie 5 stages, CLT>TVC train/explorer 5 stages, BOM>PNQ bus/maxout 4), +`ROUTE_FLAVOR`, +`genericWheelsPlan()` |
| `src/app/api/ai/plan/route.ts` | `ROAD_SYSTEM_PROMPT` → ROUTE CONTROL **journey mode** (bus/train wisdom, stages span the ride arc, requires routeCode+fareJoke); body +`vehicle`/`destination`; cache key +vehicle+dest; demo lookup by `ORIGIN>DEST` pair; hard-corrects vehicle/destination/routeCode post-parse |
| `src/app/api/ai/postcard/route.ts` | +`vehicle` branch: train = backwater bridge scene, bus = ghat road scene |
| `src/app/api/trips/route.ts` | persists `vehicle`, `destination`, `routeCode`; GET returns them for wall chips |
| `prisma/schema.prisma` | Trip +`vehicle String?`, +`destination String?`, +`routeCode String?` (nullable, `db:push`, zero migration of old rows) |
| `src/app/globals.css` | WHEELS skin: `[data-mode="road"]` token overrides (bitumen bg, hazard `--primary`, green flap text), `.sign-panel`, `.sign-panel-sm`, `.hazard-stripes`, `.road-lane`, `.board-glow-road`, `.punch-pop`, `.ticket-enter`, `.pass-exit`, `.theme-fade` crossfade |
| `src/components/terminal/bus-ticket-card.tsx` | **NEW** — the old bus ticket (below) |
| `src/components/terminal/mode-switch.tsx` | WHEELS button = Bus+TrainFront icon pair; hazard glow |
| `src/components/terminal/airport-combobox.tsx` | +`icon` (plane/bus/train), +`vehicle`, +`excludeIata`, +`id` props |
| `src/components/terminal/duration-slider.tsx` | +`label` prop (`LAYOVER WINDOW` / `TIME ON THE ROAD`) |
| `src/app/page.tsx` | `data-mode={mode}` root + `.theme-fade`; journey form (vehicle toggle + FROM/TO); pass vs ticket swap; wheels board rows + sign-panel frame; per-mode ticker/footer/summary/announce; wall chips (`WINGS` / `WHEELS·BUS` / `WHEELS·TRAIN`, route label `X → Y`); planner section widens to `max-w-5xl` while a ticket shows |

## How it works

### The bus ticket (`BusTicketCard`)

Same behavioral contract as `BoardingPassCard` (`plan, done, onToggleMission, source`) — a drop-in swap rendered when `plan.mode === "road"`.

```
┌╌╌╌╌╌╌╌┊──────────────────────────────────────────┊──────────────┐
│ADMIT   ┊ ▓ LAYOVER STATE ROADWAYS·WHEELS ▓ [TRAIN] ┊ TRAVEL STAMPS│
│ONE     ┊  KBS ─ ─ ─(🚌)── →  MJS                   ┊ (stamps slam │
│125210  ┊  ROUTE NH-766 · VIA WAYANAD GHAT          ┊  here — same │
│ (hole) ┊  The Nine Hairpins Special                ┊  as wings)   │
│serial  ┊  DATE|VEHICLE|WINDOW|FARE (2×2 grid)      ┊              │
│TK NO.  ┊  ─ ─ JOURNEY STAGES — TAP TO PUNCH ─ ─    ┊ FARE PAID    │
│        ┊  ○ STAGE 1 · MOVE · 30m · T+00:00 …       ┊ IN CHAI  ▓▓  │
└╌╌╌╌╌╌╌┊──────────────────────────────────────────┊──────────────┘
```

- Completing a stage **punches a hole** (punch button flips to `bg-background` + red check + `.punch-pop`) **and slams the stamp** — the DB PATCH path is byte-identical to wings.
- Train variant (same component, `plan.vehicle = "train"`): band `LAYOVER RAILWAYS · WHEELS DIVISION`, 🚆 icon, `TRAIN · EXPRESS`, fare `3 CHAI + 1 VADA`.
- Ticket id/serial are deterministic hashes of the plan (SSR-safe `useMemo`).
- lg: stub(120) + body(flex) + stamps(210) 3-column; mobile: horizontal stub strip + perforation.

### The theme flip

Root `<div data-mode={mode} class="theme-fade">`. All wheels styling lives under `[data-mode="road"]` token overrides — the amber wings token set is untouched default. Flip = split-flap hero re-key (`WHICH ROAD NEXT?`) + board row swap + 600ms color crossfade. Planner card becomes a `.sign-panel` green guide sign; board mounts inside a green sign frame ("HIGHWAY ADVISORY · EXIT ∞ ❯❯").

### Journey plans (AI)

`ROUTE CONTROL` journey prompt requires stages to span the arc: one near departure, ≥1 ON BOARD, one at a halt, one near arrival; requires `routeCode` + `fareJoke`. Hard-corrected post-parse. Verified live: Kochi→Mysuru bus returned "Spice Route Serenity", `NH-766 GHAT`, `2 COFFEE + 1 BANANA`, 5 journey-anchored stages.

## Reference

```
POST /api/ai/plan
  wings: { iata, city?, country?, durationMin, vibe, forceDemo? }
  wheels:{ iata, city, country, destination:{city, code}, vehicle:"bus"|"train",
           durationMin, vibe, forceDemo? }
```

Demo journeys: `KBS>MJS` (bus·foodie), `CLT>TVC` (train·explorer), `BOM>PNQ` (bus·maxout) — matched by pair key under `forceDemo`; unknown pairs → `genericWheelsPlan`.

## Extend tonight (recipes)

- **New vehicle (auto/flight-with-wheels?)**: add to `VEHICLES` + `VEHICLE_META` + prompt wisdom + one toggle button.
- **New demo journey**: add an entry to `WHEELS_DEMO_JOURNEYS` keyed `"ABC>XYZ"`; add `ROUTE_FLAVOR` line.
- **Sounds**: conductor whistle on punch → play in `toggleMission` when `planMode === "road"` (`.punch-pop` already animates).

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Ticket renders but `lg:w-[210px]` ignored, body squeezed | Tailwind dev JIT missed the new arbitrary class on HMR | touch `globals.css` (append comment + save) → full reload; never affects production build |
| `trip.create` validation error after schema change | running dev server holds the old Prisma client | restart `bun run dev` after `db:push` |
| City names crush into letter-stacks on ticket | long names in the big route row | route row shows **stop codes** (`KBS → MJS`) with city captions; do not revert to city names |
| Old trips show no vehicle chip | rows predate v3 (`vehicle` null) | expected — they render as plain WINGS |

## Verify it works

```bash
# wheels bus demo (instant)
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"KBS","city":"Kozhikode","country":"India","destination":{"city":"Bengaluru","code":"MJS"},"vehicle":"bus","durationMin":600,"vibe":"foodie","mode":"road","forceDemo":true}' | head -c 300
# station search floats railway stations first
curl -s "localhost:3000/api/airports?q=kozhikode&mode=road&vehicle=train"
# wings regression
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"DXB","durationMin":320,"vibe":"explorer","forceDemo":true}' | head -c 200
```

Browser golden path: flip WHEELS → theme flips → demo ON → KBS→Bengaluru bus → ticket renders → punch stage 1 → `aria-pressed=true` + stamp "earned" + `PATCH /api/missions/:id 200` → wall shows `KBS WHEELS·BUS Kozhikode → Bengaluru`. Wings: NEW → DXB → `BED → DXB` pass + stamps. Mobile 390px: ticket stub strip stacks, punch targets 44px. All verified with agent-browser (screenshots in `shots/`).

---

## v3.1 — The De-Airporting Pass ("zero airport UI in WHEELS")

User directive: *airport-related UI must be **completely** changed in the wheels section*. Audit found 6 leaks; all fixed so WHEELS shows **no gate/terminal/amber remnants**:

| # | Leak (was visible in road mode) | Fix |
|---|---|---|
| 1 | Hero eyebrow read `… 6PM–6AM · GATE ∞ · BAY 7` | mode-aware: road → `MILE ∞ · BAY 7` (`page.tsx`) |
| 2 | Header tagline `DEAD HOURS → ADVENTURES` | road → `DEAD MILES → ADVENTURES` |
| 3 | **Amber glows everywhere in road mode** — `board-glow` text-shadow (header brand, wall heading, board statuses, duration value, generation status) + hardcoded amber box-shadows (logo tile, mode-switch pill, vibe chip, CTA button) | **Glow engine**: `[data-mode="road"] .board-glow` re-tinted to green sign glow in CSS; new semantic `.glow-amber` / `.glow-strong` classes replace every arbitrary amber `shadow-[…]`, with road-mode overrides (hazard yellow + green halo). One CSS block re-tints the whole UI — no per-component conditionals |
| 4 | Slider thumb `accent-[#f5a623]` hardcoded amber in road mode | `accent-primary` (tracks `--primary`, flips to hazard yellow) |
| 5 | Combobox empty state `… TRY A MAJOR HUB` (airport word) | road → `NO SUCH STOP ON OUR ATLAS — TRY A MAJOR JUNCTION OR STATION` |
| 6 | Foodie vibe hint `eat the terminal` (tooltip) | `VibePicker` +`mode` prop; road hints map (`foodie` → `eat every dhaba dry`, `explorer` → `see every ghat and junction`) |

Bonus fix: hero split-flap clipped on mobile (`ICH ROAD NEX…`) — 16-char `WHICH ROAD NEXT?` × `8.5vw` cells overflowed 390px; cell size → `text-[5.6vw] sm:text-6xl lg:text-7xl` so both `WHERE TO NEXT?` and `WHICH ROAD NEXT?` fit all widths.

**Rule going forward:** never use arbitrary amber `shadow-[0_0_…]` classes in shared components — use `.glow-amber` / `.glow-strong` / `.board-glow` so the `[data-mode="road"]` overrides keep both worlds in sync. Verified v3.1 with agent-browser: wings amber intact (logo/pill/CTA glows), wheels fully green+hazard (no amber shadows left, no airport copy — `grep` for `245,166,35` in `src/` now hits only `globals.css` tokens + semantic classes). Screenshots `shots/20–33`.

---

## v4 — WHEELS as a Second World + the Choreographed World-Swap (Task 8)

User directive: *"the wheels section should feel like a complete different site focused on
road trips and train journeys. don't bring airport inspired designs to that section and also
the transition should be so smooth."* v3/v3.1 re-skinned colors and copy; v4 changes
**structures** so WHEELS is its own site that happens to share one URL.

### Structural de-airporting (what actually changed)

| # | Element | WINGS (night terminal) | WHEELS (highway by night) |
|---|---|---|---|
| 1 | **Hero** | bare dark solari, amber flaps | **highway gantry sign** — hero flaps wrapped in `sign-panel` (green + white inset border), flap cells re-skinned cream-on-green via `[data-mode="road"] .flap-cell` |
| 2 | **Advisory board** | dark solari shell (`#0e0f12`) | same shell **flattened** (`[data-mode="road"] .board-shell` → transparent) so the whole board is ONE continuous green sign; cream flap tiles carry the routes |
| 3 | **Planner heading** | `FILE YOUR FLIGHT PLAN` | `PLOT YOUR ROUTE` (aviation "file a plan" wording gone) |
| 4 | **Wall section** | `WALL OF ADVENTURES` / "filed tonight, archived forever" | `MILESTONE WALL` / "flagged off tonight, logged mile by mile"; empty line → `NO MILESTONES YET — FLAG OFF THE FIRST JOURNEY` |
| 5 | **Chrome edges** | plain hairline borders | hazard-stripe strips: `header::after` (4px) + `footer::before` (3px) in road mode only |
| 6 | **Tab title** | `LAYOVER WINGS — Flight Layovers · Night Terminal` | `LAYOVER WHEELS — Bus & Train Journeys · Highway Division` (useEffect on mode) |

The split-flap mechanism stayed in both worlds through v4 — superseded in **v4.1**: road mode
now renders a completely different machine (LED gantry, below) and never mounts a flap.

### v4.1 — SUPERSEDED by the LED advisory + wheel/plane world-swap (see end of file)

### The world-swap choreography (~0.8s, `switchMode` in page.tsx)

1. **Sweep bar** — a 140%-width slab crosses the viewport in 650ms:
   - air → road: `hazard-stripes` slab sweeping **L→R** (you're driving in)
   - road → air: amber beam sweeping **R→L** (you're flying back)
2. **Division pill** — `ENTERING WHEELS DIVISION` / `CLEARED BACK TO WINGS` fades in/out at
   screen center, riding the sweep (`sweep-label`, self-centering keyframes).
3. **Full-page crossfade** — while sweeping, root gets `.mode-morphing`:
   `background-color, border-color, color, fill, stroke, box-shadow, text-shadow` all
   transition 0.55s on **every element**, so tokens melt instead of snapping. Class is
   removed after 780ms so hover behavior is never affected at rest.
4. **Sliding ModeSwitch thumb** — single `bg-primary` pill slides WINGS⇄WHEELS with a
   300ms `cubic-bezier(0.65,0,0.35,1)` transform; the switch physically starts the journey
   under your finger.
5. Hero + board flaps re-key on mode and re-roll; the sweep covers the remount.

Accessibility: the whole overlay is `aria-hidden` + `pointer-events-none`;
`@media (prefers-reduced-motion: reduce)` disables sweep, label and morph transitions.

### Verification (agent-browser, `localhost:3000`)

- Sweep captured mid-flight: hazard stripes + pill + already-flipped gantry (`shots/41`), amber beam back + `CLEARED BACK TO WINGS` (`shots/45`)
- Settled worlds: green gantry hero + continuous green advisory + `PLOT YOUR ROUTE` (`shots/42–44`), pure amber WINGS restored with zero green residue (`shots/46`)
- Golden path in the new world: demo-lock KBS→MJS → ticket renders → stage punch → stamp slam + DB PATCH (`shots/47`)
- Mobile 390px: gantry, switch and advisory board all fit (`shots/48`); desktop viewport restored after
- `document.title` flips both ways; lint clean; dev.log error-free

### Rules going forward

- New road-mode surfaces must ask: *is this shape airport-native?* If yes, design a road-native equivalent (sign panel, waybill, milestone) — don't just re-tint.
- Any new shared component consumes tokens + `.glow-*` classes only, so both worlds and the morph keep working for free.

## v4.1 — The LED Advisory & the Wheel-Roll / Plane-Flythrough Swap (Task 9)

User directive: *"redesign the HIGHWAY ADVISORY to something related to led boards we see on
highway with red text. and also when transitioning from wings to wheels make a wheel roll which
make the section change and when from wheels to wings make a plane fly through make the section
change. also keep the transition smooth."*

### 1. HIGHWAY ADVISORY → red LED variable-message sign (`LedAdvisory`)

New `src/components/terminal/led-advisory.tsx`. In road mode the hero board is **not a departure
board at all** — it's the red dot-matrix gantry sign that hangs over national highways:

| Part | Implementation |
|---|---|
| Cabinet | `.led-frame` — metal gradient bezel, corner `.led-bolt` ×4, deep drop shadow |
| LED face | `.led-surface` — `#070807` black, inset dark halo, unlit pixel grid via `::before` (`radial-gradient` 7px dot), glass sheen + vignette via `::after` |
| Red LEDs | `.led-text` — `#ff3b30` with 3-layer red `text-shadow` halo; `.led-dim` variant for ID strips |
| Messages | 6 advisories cycle every 4.4s (`CAUTION / ADVENTURE AHEAD`, `NEXT EXIT / DUBAI · 9999 KM`, `HORN OK PLEASE / DRIVE SAFE`…); rows remount per tick so `.led-relight` replays the LEDs-powering-on flicker |
| Extras | blinking `.led-dot` + LIVE lamp, marching `.led-march` chevrons ❯❯❯, `EXIT ∞` strip, full-panel `.led-flicker` (barely perceptible refresh wobble), `role="img"` + aria-label for screen readers |

Page wiring: `{mode === "air" ? <DepartureBoard/> : <LedAdvisory/>}`. Dead CSS removed with the
old approach: `[data-mode="road"] .flap-cell`, `.flap-face`, `.board-shell` (road never mounts a
flap now). `WHEELS_BOARD_ROWS` deleted from page.tsx.

### 2. World-swap v2 — the vehicle IS the transition (`WorldTransition`)

New `src/components/terminal/world-transition.tsx` replaces the stripe sweep. One overlay,
two choreographies, all CSS keyframes in globals.css ("WORLD-SWAP CHOREOGRAPHY v2"):

- **to-road (wheel)**: a spoked wheel (`.wheel-tire` tread via `repeating-conic-gradient`,
  `.wheel-rim` hazard-yellow spokes, `.wheel-hub`) rolls `translateX` across the viewport while
  `.wheel-spin` rotates it 1080° on a nested layer (roll and spin never fight). Behind it
  `.world-wipe-road` unrolls the new world: asphalt grit + hazard edge stripes + dashed yellow
  `.road-centerline` — the wheel literally lays down fresh tarmac. Shadow ellipse rides under it.
- **to-air (plane)**: `.world-plane` climbs `(-14vw,68vh) → (112vw,18vh)` carrying a glowing
  amber `Plane` glyph (rotate 38° = heading + climb) and a fading `.plane-contrail`; the
  `.world-wipe-air` panel paints the amber night sky (stars `::before`, leading amber beam
  `::after`) back over the road world.
- **Mid-flight world flip**: `switchMode` no longer flips `data-mode` instantly. `FLIP_MS = 420`
  timer fires `setMode` + form resets the moment the vehicle crosses mid-screen — the section
  visibly changes *under* the vehicle. `SWEEP_MS = 1250` unmounts the overlay. Guard
  `if (m === mode || sweep) return` makes the swap atomic (rapid clicks ignored). Timers live in
  refs and clear on unmount.
- **Smoothness**: the wipe panel fades out over its last 20% (no pop when it unmounts) while
  `.mode-morphing` (kept from v4) crossfades every color underneath; the tag pill
  (`.world-tag-road` green / `.world-tag-air` amber) rides bottom-center.
- Reduced-motion: all overlay parts + LED animations get `animation: none; opacity: 0`.

### v4.1 Verification (agent-browser, `localhost:3000`)

- Wheel roll captured mid-flight: asphalt + hazard edges + centerline + wheel at leading edge
  (`shots/41`), start frame (`shots/40`), settled LED world (`shots/42`)
- LED advisory: red dot-matrix CAUTION / ADVENTURE AHEAD, LIVE lamp, chevrons, bolts
  (`shots/42`); fits 390px mobile (`shots/50`)
- Plane flythrough: amber glyph + contrail climbing over the still-visible road world
  (`shots/46`), sky fully painted (`shots/44`), WINGS restored (`shots/45`)
- Flip + guard: title flips both ways, second click mid-transition ignored, data-mode settles
  `road`→`air` correctly
- Golden path intact post-refactor: demo KBS→MJS → ticket → stage punch → MOVE stamp (`shots/52–53`)
- Ops note: a heavy globals.css rewrite while `next dev` runs can leave the served CSS chunk
  stale (JS hot-reloads, CSS doesn't). Fix used: kill dev server, `rm -rf .next`, restart
  detached (`(setsid bun run dev &)`). Verify with `curl` on the chunk grep-ing new selectors.
- lint clean, dev.log error-free, zero console errors

---

## v4.2 — THE JET (user-directed rework of the to-air flythrough)

User brief: *"when changing wheels to wings, we need a plane flying right to left,
the plane size should completely fill the screen."*

### What changed

- **Direction flipped**: the jet now enters from the RIGHT edge and exits LEFT
  (`plane-fly`: `translate(50vw + plane/2 + 3vw, 60vh) → translate(−(plane/2 + 3vw), 40vh)`),
  climbing gently as it goes west.
- **The plane IS the wipe**: `--plane: clamp(480px, 150vmax, 2200px)` — the airframe is
  ~1.5× the viewport wide, so the aircraft itself fills the screen as it crosses. The old
  small lucide glyph was replaced by a purpose-drawn side-view airliner silhouette
  (`JetSilhouette` in world-transition.tsx): tailfin, tailplane, fuselage, cockpit glass,
  14-window line, doors, swept wing, twin engine pods with dark intakes. At 150vmax it is
  unmistakably a 747 profile, not a yellow blob (first attempt used a filled lucide
  glyph — it read as abstract geometry at that zoom, so it got replaced).
- **Sky follows the jet**: `.world-wipe-air` now has `transform-origin: right center` so the
  amber night sky unrolls from the right edge (the direction the plane came from); the
  leading amber beam moved to the panel's LEFT edge where the nose breaks through first.
- **Contrails re-anchored**: twin trails start at the engine exhausts
  (`left: calc(var(--plane)*0.28)`, 17vh/21vh below the flight path) and stream EAST behind
  the westbound jet, fading rightward.
- **Glow without the tax**: a static `.plane-glow` radial ellipse sits behind the metal —
  animating a drop-shadow filter on a 2200px glyph would re-raster every frame.
- Attitude: `.plane-glyph` rotates −6° (nose-up climb); timing unchanged (1.15s flight,
  FLIP_MS 420 still lands the flip while the airframe covers mid-screen).
- The small tag icon mirrors westward (`-scale-x-100`) to match the heading.

### v4.2 Verification (agent-browser + video frames)

- Recorded WHEELS→WINGS at 30fps, extracted 15fps frames: nose enters from right with
  cockpit + window line readable (`shots/58`), full airframe covers the entire viewport with
  sky + contrails painting in behind (`shots/59`), WINGS fully restored ~1s later (`shots/60`).
- Wheel roll into WHEELS re-verified after the CSS edits (`shots/55–57`).
- lint clean, zero console errors.
