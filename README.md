# LAYOVER ✈🚌 — Turn your layover into an adventure

> **WINGS: type an airport + layover length → boarding pass. WHEELS: pick a route + bus or train → old bus ticket. AI turns every dead hour into a timed, mission-based micro-adventure — stamped forever. Two worlds, one engine.**

Built for **LAYOVER 2026**, the overnight travel hackathon at TinkerSpace Calicut (Oct 10–11, 2026).
Meta-story, free of charge: *we came to LAYOVER, so we built LAYOVER.*

| | |
|---|---|
| **Status** | ✅ v3 "Two Worlds, One Terminal" — WINGS + WHEELS built & browser-verified (see `worklog.md`) |
| **Stack** | Next.js 16 · TypeScript · Tailwind 4 · shadcn/ui · Prisma/SQLite · z-ai-web-dev-sdk |
| **Design** | WINGS = amber "Night Terminal" · WHEELS = green highway signage + red-ink bus ticket. No blue. DAY ⇄ NIGHT toggle (header) re-lights both worlds — ivory day palettes, machines stay dark. **EVERY BODY BOARDS**: file a real IATA assistance code (WCHR/DPNA/DEAF) and every AI mission is planned around your body — step-free rolls, quiet routes, captioned announcements — printed on the ticket like any airline. |
| **Demo safety** | 3-layer fallback chain, both worlds — the 8 AM demo cannot die (see Demo Mode) |

---

## Quickstart

```bash
bun install          # dependencies
bun run db:push      # create/sync SQLite db (db/custom.db)
bun run dev          # dev server on :3000 (logs → dev.log)
bun run lint         # code quality check
```

> ⚠️ In the sandbox preview, use the **Preview Panel** (or "Open in New Tab") — not localhost URLs.

### 30-second demo script (judges, teammates, 3 AM sanity checks)
1. Landing: split-flap hero `WHERE TO NEXT?`, departures board cycling. **WINGS ⇄ WHEELS switch** sits above it.
2. WINGS: pick an airport (`DXB`, `SIN`, `CCJ` have pre-baked demo plans), drag the slider, pick a vibe.
3. **REQUEST ADVENTURE** → theatrical status lines (`CONTACTING GATE CONTROL…`) while AI works.
4. Boarding pass slides in: adventure title, route `BED → DXB`, timed missions, barcode, fun fact.
5. **Flip to WHEELS** — the whole page re-skins live: bitumen-green world, HIGHWAY ADVISORY board, journey form with a `BUS · ROADS / TRAIN · RAILS` toggle.
6. Pick `KBS → Bengaluru` (pre-baked demo journey), **FLAG OFF THE JOURNEY** → an **old bus ticket** tears in: `KBS → MJS`, `ROUTE NH-766 · VIA WAYANAD GHAT`, `FARE: 4 CHAI + 2 PAROTTA`, journey stages.
7. Tap a stage → conductor **punch-hole** + passport stamp SLAMS ("your ticket is your passport").
8. **AI postcard** (ghat-road / backwater-train scene) + the **conductor announcement**. Wall below shows both worlds with chips.

---

## Architecture

```
src/
  app/
    page.tsx                    # the product experience (hero → planner → pass → wall)
    layout.tsx                  # Sora + Space Mono fonts, metadata
    globals.css                 # Night Terminal design tokens + signature CSS
    api/
      ai/plan/route.ts          # LLM → strict-JSON mission plan (zod, cache, fallback)
      ai/postcard/route.ts      # image gen → vintage postcard (data URL)
      ai/announce/route.ts      # TTS → gate announcement WAV
      airports/route.ts         # GET ?q= airport search
      trips/route.ts            # POST archive · GET wall of adventures
      missions/[id]/route.ts    # PATCH toggle → mints/deletes passport stamp
  components/terminal/          # signature components (see docs/features/)
  lib/
    airports.ts                 # 74 airports + 22 wheels stops (bus stands, rail stations, halts), offline
    modes.ts                    # WINGS ⇄ WHEELS registry — the re-skin engine
    plan-schema.ts              # zod contract: Plan / Mission / vibes / categories / mode / vehicle
    demo-mode.ts                # pre-baked plans (air + wheels journeys) + fake streaming + status lines
    db.ts                       # Prisma client singleton
prisma/schema.prisma            # Traveler → Trip → Mission → Stamp (Trip: mode, vehicle, destination, routeCode)
db/custom.db                    # SQLite file
```

**Data flow:** input flow → `POST /api/ai/plan` → zod-validated `Plan` → boarding pass render → mission toggles `PATCH /api/missions/[id]` (stamps) → `POST /api/trips` archives to the wall.

---

## API reference (summary)

| Endpoint | Method | Body / Query | Returns |
|---|---|---|---|
| `/api/ai/plan` | POST | wings: `{ iata, durationMin 60–720, vibe, forceDemo? }` · wheels: `{ iata, destination{city,code}, vehicle, durationMin, vibe, mode:"road", forceDemo? }` | `{ ok, plan: Plan, source: "ai"\|"cache"\|"demo", note? }` |
| `/api/ai/postcard` | POST | `{ city, country, vibe, iata?, mode?, vehicle? }` | `{ ok, imageDataUrl?, source: "ai"\|"none" }` |
| `/api/ai/announce` | POST | `{ text ≤600 chars }` | `audio/wav` stream |
| `/api/airports` | GET | `?q=dub&mode=air\|road&vehicle=bus\|train` | `{ ok, results[], count }` |
| `/api/trips` | POST | `{ nickname?, plan, source? }` | `{ ok, trip }` |
| `/api/trips` | GET | `?limit=12` | `{ ok, trips[] }` (wall: counts + stamps) |
| `/api/missions/[id]` | PATCH | `{ done }` | `{ ok, mission, stamp }` |

The `Plan` contract (zod, single source of truth): `{ adventureTitle, airport{iata,city,country}, vibe, mode?: "air"\|"road", vehicle?: "bus"\|"train", destination?: {city, code?}, routeCode?, fareJoke?, totalDurationMin, bufferMin, funFact, missions[2–6]{ title, description, durationMin, category, location, tip? } }` — categories: `eat | explore | chill | move | weird | rest`.

---

## Demo mode — the 8 AM insurance policy

Three layers, in order (venue wifi *will* misbehave):

1. **DEMO MODE toggle** (footer) → `forceDemo: true` → serves pre-baked plans instantly, bypasses cache/API, UI shows a **TRAINING MODE** badge.
2. **Server fallback** → if the LLM errors or times out (48 s cap), the route itself returns a demo plan with `source: "demo"` — the UI never breaks.
3. **Offline dataset** → search runs client-side over the bundled stop list (74 airports + 22 wheels stops incl. railway stations); no network needed to type a stop.

Bespoke demo plans: wings `DXB`, `SIN`, `CCJ` · wheels journeys `KBS>MJS` (Kozhikode→Bengaluru bus·foodie), `CLT>TVC` (Kozhikode→Trivandrum train·explorer), `BOM>PNQ` (Mumbai→Pune bus·maxout). Everything else gets a plausible generic plan (`genericDemoPlan` / `genericWheelsPlan`).

---

## Design system — Night Terminal (tokens cheat-sheet)

| Token | Value | Use |
|---|---|---|
| `--background` | `#0B0B0D` (WINGS) → `#0C100C` (WHEELS) | app background |
| `--primary` | `#F5A623` amber (WINGS) → `#F5C518` hazard (WHEELS) | buttons, accents |
| `--foreground` | `#F2EEE3` | warm off-white text |
| `--paper` | `#F4EFE4` | pass + bus-ticket paper |
| `--ink` | `#17150F` | printed ink on paper |
| ticket red | `#B3331F` | bus-ticket ink (in-component) |
| sign green | `#0E7A3D` | highway guide-sign panels (`.sign-panel`) |

Fonts: **Sora** (display, `font-sans`) · **Space Mono** (codes/times, `font-mono`).
Signature CSS in `globals.css`: wings `.flap-cell` `.perforation-v/h` `.notch` `.barcode` `.qr-blocks` `.stamp-slam` `.pass-enter` `.ticker` `.board-glow` `.scanlines` `.blink-slow` `.radar-dot` `.safe-bottom` · wheels `[data-mode="road"]` token overrides + `.sign-panel` `.hazard-stripes` `.road-lane` `.board-glow-road` `.punch-pop` `.ticket-enter` `.pass-exit` `.theme-fade`.
**Rule: no blue/indigo anywhere** — it's what makes the booth look different from 100 other projects.

---

## Feature ladder

| Layer | Scope | Status |
|---|---|---|
| **L1 — spine** | input flow → AI plan → boarding pass → mission timeline | ✅ in base |
| **L2 — delight** | stamps + wall persistence, demo mode, AI postcard | ✅ in base |
| **WINGS ⇄ WHEELS** | full highway-sign WHEELS world: journey form (BUS/TRAIN), old bus ticket with punch-holes, wheels demo journeys, live skin flip | ✅ **tonight** |
| **L3 — showmanship** | TTS announcement (✅ both worlds), share card, delay re-planner, sleep-score, sounds, passport view | 🔜 if time allows |

Tonight's hour-by-hour build plan: **`HACKATHON-NIGHT.md`** (read at 5 PM at TinkerSpace).

---

## 📚 Documentation system (keep this alive!)

| Doc | What it is |
|---|---|
| `README.md` | **this file** — always-current project overview |
| `EXPLAINER.md` | **plain-English tour** of the whole site — for non-technical friends/judges |
| `PLAN.md` | event decode, strategy, pitches, risk register (the why) |
| `HACKATHON-NIGHT.md` | tonight's build handoff: priorities, prompts, judge-prep |
| `worklog.md` | **chronological work log** — one appended section per task/agent |
| `docs/README.md` | **documentation convention** + feature-doc template + index |
| `docs/features/NN-*.md` | **one deep-dive per major feature** — internals, props/API reference, extend-recipes, troubleshooting tables |

**The protocol (from tonight onward):**
1. Shipped a major feature or made a big change? → create `docs/features/NN-slug.md` using the template in `docs/README.md`, add it to the index.
2. Finished any work session? → **append** (never overwrite) a section to `worklog.md` with Task ID, steps, decisions, errors+fixes.
3. Broke something and fixed it? → add the row to that feature doc's **Troubleshooting** table. Future-you at 4 AM says thanks.

---

## Troubleshooting quick hits

| Symptom | First move |
|---|---|
| Page blank / crash after an edit | `tail -50 dev.log` — the Next.js error is there |
| DB errors / missing tables | `bun run db:push` (schema drifted from `db/custom.db`) |
| Plan comes back `source: "demo"` unexpectedly | AI API unreachable/timed out — check `dev.log` for `[ai/plan]` lines; fallback is working as designed |
| Port 3000 busy | kill duplicate dev servers, restart `bun run dev` |
| Styles look "off-blue" or default | you used a hex literal instead of a token — see design table above |
