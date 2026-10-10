# 07. Transport modes — the AIR ⇄ ROAD engine

> Status: ✅ lib/API · 🚧 component layer (spec'd below, building in parallel) · Last verified: 2026-10-10 · Owner: Z.ai Code (main) · Docs: Task 4-b

## TL;DR
One registry (`MODE_META`), one switch, and the whole terminal re-skins: the same mission engine now serves **airports (AIR / GATE CONTROL)** and **bus stands + highway halts (ROAD / ROUTE CONTROL)**. Hero text, board rows, pass title, search pool, AI persona, theatrical status lines, and wall copy all flip per mode — while the zod schema, stamps, and wall of adventures stay untouched.

## Why it exists (rubric tie)
**This is the hackathon pivot.** The theme widens from "airport layovers" to **all travel dead-hours** — a bus-stand wait in Kerala IS a layover. The mode flip is the demo moment: press ROAD and the entire product transforms in one second (Creativity 10, Demo 5). It doubles the travel-connection story for a Calicut floor where the KSRTC stand is a more honest layover than CCJ (Travel 10). And it costs almost nothing: the mission engine is mode-agnostic, so every mark above is earned by *flavor*, not by a second codebase (Built 20).

## Files
| File | Responsibility |
|---|---|
| `src/lib/modes.ts` | Registry: `TransportMode`, `ModeMeta`, `MODE_META`, `MODE_LIST`, `ROAD_CONTROL_LINES` |
| `src/lib/airports.ts` | `ROAD_STOPS` (14 stops), `ALL_STOPS`, `searchAirports(q, limit, mode?)`, `findAirport` over all stops |
| `src/lib/plan-schema.ts` | `MODE_IDS = ["air","road"]`, `PlanMode`, `planSchema` optional `mode` field |
| `src/lib/demo-mode.ts` | `ROAD_DEMO_PLANS` (KBS, MJS), `genericRoadPlan()`; `GATE_CONTROL_LINES` still exported (air) |
| `src/app/api/ai/plan/route.ts` | `body.mode`, mode-aware cache key, `ROAD_SYSTEM_PROMPT` vs `SYSTEM_PROMPT`, `demoFallback` branch, hard-corrects `plan.mode` |
| `src/app/api/trips/route.ts` | POST stores `Trip.mode`; GET returns `mode` per trip |
| `src/app/api/airports/route.ts` | `GET ?mode=air\|road` filters the search pool |
| `prisma/schema.prisma` | `Trip.mode String @default("air")` |
| `src/components/terminal/*` (🚧) | `ModeSwitch` + optional mode props on 5 components — see Reference |

## How it works — the mode flow

**1 · Switch.** `ModeSwitch({ mode, onChange })` renders `MODE_LIST` as a segmented AIR/ROAD control and sets `mode` state in `page.tsx` (placed above the hero board).

**2 · Re-skin.** Everything visual reads `MODE_META[mode]`: hero `SplitFlapText` flips "WHERE TO NEXT?" ↔ "WHERE THE ROAD WAITS?"; `DepartureBoard` is **re-keyed by mode** (`key={mode}`) so it fully remounts — rows swap to "BAY BOARD" rows and column 1 flips FLIGHT → ROUTE. Wall empty-state flips via `emptyWallLine`.

**3 · Mode-aware search.** `searchAirports(query, limit = 8, mode?)` pools `ALL_STOPS` (= `AIRPORTS` then `ROAD_STOPS`), filtered by `(s.mode ?? "air") === mode`; entries without `mode` default to `"air"`, so old airport data needed zero edits. Scoring unchanged (iata 100/90 → city 80/55 → country 60/35 → name 40, +6 India boost). `findAirport(iata)` searches **all** stops, so the server resolves KBS/MJS/RSP too. `/api/airports?q=…&mode=road` exposes the same filter; only `"air"`/`"road"` params are honored, anything else = unfiltered.

**4 · Mode-aware AI persona.** `POST /api/ai/plan` normalizes `mode: body.mode === "road" ? "road" : "air"` and picks the persona: `ROAD_SYSTEM_PROMPT` ("ROUTE CONTROL" — bus terminals, dhabas, rig spotting, luggage-safe ground missions) vs `SYSTEM_PROMPT` ("GATE CONTROL"). `userPrompt()` swaps the kind to "bus stand / highway halt". Same ZAI call, same 48 s race, same `extractJson` + zod — then the route **hard-corrects `plan.mode`** so the model can never drift it.

**5 · Same engine underneath.** One zod contract (`planSchema` gains only `mode: z.enum(MODE_IDS).optional()` — absent = `"air"`, backwards compatible with every old client), same `missionOffsets`, same `CATEGORY_META` stamps, same wall. `/api/trips` persists `mode: plan.mode === "road" ? "road" : "air"` and returns it per trip; Prisma column defaults to `"air"` so pre-mode rows stay valid.

**Fallbacks are mode-aware at every layer:** `cacheKey()` is now `mode:iata:durationMin:vibe` (KBS and DXB can never collide); `demoFallback()` branches by mode → `ROAD_DEMO_PLANS[iata]` (`KBS` "The Mavoor Road Miniseries" foodie 240/60 · `MJS` "Operation Majestic" maxout 260/75) else `genericRoadPlan()` ("The ${city} Roadside Circuit"), mirrored by the client-side fallback (`genericDemoPlan` vs `genericRoadPlan`). Pre-baked road plans carry `mode: "road"`. Demo still never reads the cache.

## Reference

### ModeMeta fields (`MODE_META` in modes.ts)
| Field | air | road |
|---|---|---|
| `id` / `label` | `air` / AIR | `road` / ROAD |
| `icon` (lucide hint) | `plane` | `bus` |
| `heroText` | WHERE TO NEXT? | WHERE THE ROAD WAITS? |
| `boardHeading` / `firstColLabel` | DEPARTURES / FLIGHT | BAY BOARD / ROUTE |
| `passTitle` / `passSubtitle` | BOARDING PASS / LAYOVER TERMINAL · DEAD HOURS DIVISION | ROAD PASS / BUS BAY DIVISION · HIGHWAY DEAD HOURS |
| `routeFrom` | BED (BED → DXB) | DOOR (DOOR → KBS) |
| `stopLabel` / `stopPlaceholder` | LAYOVER AIRPORT / Departure or layover airport | BUS BAY / REST STOP / Bus stand, rest stop, or highway halt |
| `tryHint` | TRY: DXB · SIN · CCJ · AMS — WORKS OFFLINE | TRY: KBS · MJS · VYT · RSP — WORKS OFFLINE |
| `statusLines` | `GATE_CONTROL_LINES` (6) | `ROAD_CONTROL_LINES` (6: HAILING A DRIVER…, NEGOTIATING WITH THE CONDUCTOR…, …) |
| `announceKind` (TTS) | "layover adventure" | "road trip mission run" |
| `emptyWallLine` | …FILE A FLIGHT PLAN | …FILE A ROAD PLAN |

`MODE_LIST` = `[MODE_META.air, MODE_META.road]` — registry order for the switch UI. `ROAD_STOPS` (14): KBS Kozhikode KSRTC Mavoor Rd, VYT Kochi Vyttila Hub, THP Thampanoor, QLN Kollam, TCR Thrissur, KNR Kannur, ALP Alappuzha, MJS Bengaluru Majestic, CMT Chennai CMBT, GPM Coimbatore Gandhipuram, MYS Mysuru, RSP NH-66 Rest Plaza, NHT NH-48 Food Mall, DHB NH-44 Dhaba. All `region:"india"`, 3-letter codes kept in `iata` for schema compat.

### Mode-aware API surface
| Endpoint | Mode param | Effect |
|---|---|---|
| `POST /api/ai/plan` | body `mode?: string` | persona + `userPrompt` kind + `demoFallback` branch + `plan.mode` hard-correct + first segment of `cacheKey` (`mode:iata:durationMin:vibe`); anything ≠ `"road"` = air |
| `GET /api/airports` | `?mode=air\|road` | filters `searchAirports(q, limit, mode)` pool |
| `POST /api/trips` | via `plan.mode` | stores `Trip.mode` (`"road"` or `"air"`); validation: `planSchema` `mode` must be in `MODE_IDS` or absent |
| `GET /api/trips` | — | returns `mode` per trip (old rows read `"air"` from the column default) |

### Component layer (spec — being built in parallel)
| Component | Mode prop (default) | Road passes |
|---|---|---|
| `mode-switch.tsx` `ModeSwitch({ mode, onChange })` | NEW — segmented AIR/ROAD from `MODE_LIST`, `role="radiogroup"`, amber active state, lucide Plane/Bus, 44px targets | — |
| `departure-board.tsx` | `firstColLabel?: string` ("FLIGHT") | "ROUTE" |
| `generation-status.tsx` | `lines?: string[]` (`GATE_CONTROL_LINES`) | `ROAD_CONTROL_LINES` |
| `boarding-pass-card.tsx` | `passTitle?: string` ("BOARDING PASS"), `passSubtitle?: string` ("LAYOVER TERMINAL"), `routeFrom?: string` ("BED") | "ROAD PASS", "LAYOVER TERMINAL"-style road subtitle, "DOOR" → "DOOR → KBS" |
| `airport-combobox.tsx` | `mode?: "air" \| "road"` (filters `searchAirports` pool), `placeholder?: string` | mode="road" + road placeholder |
| `page.tsx` (in progress) | `mode` state; ModeSwitch above hero board; `DepartureBoard` re-keyed by mode (full split-flap re-skin); hero SplitFlapText per mode; request body includes `mode`; client fallback `genericDemoPlan` vs `genericRoadPlan`; wall cards show mode icon; TTS `announceKind` per mode | — |

## Extend tonight (recipes)
1. **ADD A RAIL MODE (~6 steps):** ① `modes.ts` — extend `TransportMode` with `"rail"`, add a `ModeMeta` entry (label RAIL, icon `"tram-front"`, `heroText` "WHICH PLATFORM NEXT?", `boardHeading` "PLATFORM BOARD", `firstColLabel` "TRAIN", `passTitle` "PLATFORM PASS", `routeFrom` "PLATFORM", `statusLines` new `RAIL_CONTROL_LINES`, `announceKind` "rail mission run") and append to `MODE_LIST`. ② `plan-schema.ts` — add `"rail"` to `MODE_IDS` (zod + `PlanMode` follow). ③ `airports.ts` — add `RAIL_STOPS: Airport[]` (`mode: "rail"`, e.g. CLT Kozhikode, ERS Ernakulam, TVC Central) and append to `ALL_STOPS`. ④ `demo-mode.ts` — add `RAIL_DEMO_PLANS` (bespoke + `genericRailPlan`, `mode: "rail"`). ⑤ `plan/route.ts` — extend `demoFallback()` with a rail branch (bespoke locker → generic) and optionally a `RAIL_SYSTEM_PROMPT` persona; cache key needs no edit (mode is already in it). ⑥ DB — nothing: `Trip.mode` is a plain `String`, components just add the switch entry. Note: `Trip.mode` write in `/api/trips` currently collapses to road/air — widen that ternary when you ship rail.
2. **Add a WATER mode:** same 6-step recipe; stops = jetties (Fort Kochi, Kollam, Alappuzha boat jetty), `routeFrom: "GANGWAY"`, `statusLines` like "MINDING THE MONSOON…", "CHECKING THE TIDE TABLE…".
3. **Per-mode accent colors:** add an `accent?: string` field to `ModeMeta`, map it to a CSS var on the top-level wrapper, and let signature classes inherit — keep the Night Terminal no-blue rule (doc 01).
4. **Per-mode board rows:** give `DepartureBoard` an optional `rows?: string[]` alongside `firstColLabel` and feed mode-specific rows from `MODE_META` (e.g. road: "KBS — MAVOOR RD — BOARDING"), instead of the shared auto-cycling set baked in departure-board.tsx.

## Troubleshooting (symptom → cause → fix)
| Symptom | Cause | Fix |
|---|---|---|
| Road mode search shows airports | `mode` prop not passed to `AirportCombobox` / `searchAirports` | Pass `mode="road"` — the pool filter is `(s.mode ?? "air") === mode`; without it the combobox searches all 88 stops |
| Plan returns air missions in road mode | `mode` missing from the POST body | `body.mode === "road"` is the only road trigger — include `mode:"road"` in the `/api/ai/plan` request |
| Old wall trips all show AIR icon | `Trip.mode` column defaults to `"air"` for pre-mode rows | Expected, by design — only new trips carry `mode:"road"`; no backfill needed |
| TRAINING MODE road plan shows air titles | `ROAD_DEMO_PLANS` key mismatch (not the uppercase 3-letter stop code) | Key the locker by `iata.toUpperCase()` — `KBS`/`MJS` exactly as in `ROAD_STOPS` |
| Cache serves a plan for the wrong mode | Dev server was running with the old key (no mode segment) | `cacheKey` is now `mode:iata:durationMin:vibe` — restart the dev server after editing the route to flush the Map |
| zod rejects a road plan (`mode` invalid) | `plan.mode` isn't in `MODE_IDS` | `planSchema` requires `mode ∈ {"air","road"}` (or absent); the route hard-corrects it — don't strip the field client-side |
| DB error "no such column: mode" | SQLite file predates the schema change | `bun run db:push` |

## Verify it works
App on **localhost:3000**.

```bash
# road search — expect road stops only, KBS first (India boost), zero airports
curl -s "localhost:3000/api/airports?q=kozh&mode=road" | head -c 300

# road forceDemo KBS — expect "The Mavoor Road Miniseries", "mode":"road", source:"demo", instant
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"KBS","city":"Kozhikode","country":"India","durationMin":240,"vibe":"foodie","mode":"road","forceDemo":true}' | head -c 300

# road live AI MJS — expect source:"ai" ("cache" on rerun), ROUTE CONTROL ground missions, "mode":"road"
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"MJS","city":"Bengaluru","country":"India","durationMin":260,"vibe":"maxout","mode":"road"}' | head -c 300

# air regression (no mode field) — expect "The Golden Hour Layover", source:"demo", unchanged behavior
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"DXB","durationMin":320,"vibe":"explorer","forceDemo":true}' | head -c 300
```

Browser click-path (once the component layer lands): flip **ModeSwitch** to ROAD → the departure board **re-flips** (re-keyed remount) to BAY BOARD with ROUTE column and hero "WHERE THE ROAD WAITS?" → combobox now lists only road stops; pick **KBS** → **REQUEST ADVENTURE** → status overlay cycles "HAILING A DRIVER…" lines → pass renders as **ROAD PASS**, "DOOR → KBS" (TRAINING MODE badge if demo lock is on) → completing a mission still slams the same stamps; the wall card shows the bus icon.
