# PLAN-WHEELS — "Two Worlds, One Terminal" (v3)

> **Status: ✅ BUILT > **Status: AWAITING "GO"** — nothing below is built yet. Read, then say go. VERIFIED** (see `worklog.md` Task 5 + `docs/features/08-wings-wheels-highway-mode.md`). Deviations from this plan are logged there.

## 1. TL;DR

LAYOVER becomes a **two-world travel machine**:

- **WINGS** (✈) = air mode. The amber night-terminal you already love — boarding pass, departure board, gate announcements. Untouched except a rename.
- **WHEELS** (🚌🚆) = bus **and** train journeys. A **completely different skin**: green highway-guide-sign panels, hazard-yellow accents, mile-marker boards — and the boarding pass is replaced by a **vintage old bus ticket** (cream paper, red ink, perforations, conductor punch-holes, fare jokes).
- One flip of the **WINGS ⇄ WHEELS** switch re-skins the entire page live — that transition IS the demo moment that pulls a crowd.
- **Stamps stay exactly as they are** — same categories, same slam animation, same DB. Your bus ticket gets passport-stamped. That joke sells itself.
- Missions engine, zod contract, demo fallback chain, DB core, wall — all unchanged underneath. Only flavor, skin, and input shape change.

---

## 2. What stays untouched (the spine)

| Piece | Status |
|---|---|
| Mission categories (`eat/explore/chill/move/weird/rest`) | ✅ unchanged — stamps depend on them |
| StampBadge slam animation + DB minting (PATCH `/api/missions/:id`) | ✅ unchanged (you asked: keep stamps) |
| zod `planSchema` shape (missions, vibe, durations, buffer) | ➕ gains 2 optional fields only (`vehicle`, `destination`) |
| 3-layer demo fallback chain (toggle → server catch → offline search) | ✅ same architecture, new wheels content |
| Wall of Adventures + `/api/trips` | ✏️ gains a mode chip + route label |
| Prisma core (Traveler→Trip→Mission→Stamp) | ➕ 2 nullable columns, zero migrations of old data |
| Postcard press + TTS announcements | ✏️ gain a wheels prompt branch |
| **Internal mode ids `"air"` / `"road"`** | ✅ **stay** — zero DB churn. Only user-facing labels become WINGS / WHEELS. |

---

## 3. Rename map (air/road → WINGS/WHEELS)

| Where | WINGS | WHEELS |
|---|---|---|
| Mode switch label | `✈ WINGS` | `🚌🚆 WHEELS` |
| Hero split-flap | `WHERE TO NEXT?` | `WHICH ROAD NEXT?` |
| Hero subline | `FLIGHT LAYOVERS · AMBER TERMINAL` | `BUS & TRAIN JOURNEYS · HIGHWAY DIVISION` |
| Board heading | `DEPARTURES` | `HIGHWAY ADVISORY` |
| Board col 1 | `FLIGHT` | `ROUTE` |
| Planner heading | `FILE YOUR FLIGHT PLAN` | `FILE YOUR JOURNEY PLAN` |
| Generate button | `REQUEST ADVENTURE` | `FLAG OFF THE JOURNEY` |
| Pass artifact | `BOARDING PASS` | `OLD BUS TICKET` (new component) |
| AI persona | `GATE CONTROL` | `ROUTE CONTROL` |
| Announce voice | tower announcement | **conductor call / station PA** |
| Footer | `AIR ⇄ ROAD` | `WINGS ⇄ WHEELS · HORN OK PLEASE` |
| Wall chip | `✈ WINGS` | `🚌 WHEELS·BUS` / `🚆 WHEELS·TRAIN` |

---

## 4. Design spec — the WHEELS skin (highway signage)

Strategy: root wrapper gets `data-mode="road"`. CSS variables + a few utility classes do the re-skin; components read tokens, so the flip is one attribute.

**Palette (no blue/indigo, ever):**

| Token | WINGS (now) | WHEELS |
|---|---|---|
| `--background` | `#0B0B0D` night terminal | `#0C100C` **bitumen black-green** |
| `--primary` | amber `#F5A623` | **hazard yellow** `#F5C518` (amber is already 90% there) |
| sign green | — | `#0E7A3D` guide-sign green + white `2px` inset border |
| ticket cream / ink | paper/ink tokens | **same tokens** — `#F4EFE4` / red `#B3331F` |
| glow | amber `board-glow` | green `board-glow-road` |

**Component restyles (wheels only):**

1. **Highway Advisory Board** (replaces departure-board skin): rows become green guide-sign panels — `NH-766 | GHAT SECTION | 9 HAIRPINS | DRIVE SLOW`, `DHABA MILE 42 | PAROTTA RADAR | BOARDING`, `TOLL PLAZA 3 | EXACT CHANGE ONLY | SLOW`, `VENDE BHARAT | PANTRY CAR ONLINE | ON TIME`, `DEMO LOCKER | DEAD-WIFI INSURANCE | STANDBY`, `DUBAI | WINNERS ONLY | FINAL CALL` (the joke survives). Chevron `❯❯` accents, white inset borders, one yellow-top kilometer-stone row.
2. **Planner card** = a green highway guide sign: rounded rectangle, white inset border, big white mono text, distance-style chips ("JOURNEY 10 HRS · NH-766").
3. **Ticker**: `✦ NH-66 COASTAL RUN ✦ VENDE BHARAT ✦ DHABA OPEN ALL NIGHT ✦ HORN OK PLEASE ✦ SAME ENGINE · NEW ROADS ✦`.
4. **Button** = hazard yellow, black text, hazard-stripe edge on hover.
5. **Footer**: `WHEELS DIVISION · NH-∞ · CONDUCTOR ON DUTY`.
6. **Scrollbars/dividers**: dashed white road-lane lines instead of amber.

**The flip (transition moment — practice this at the booth):**
Click `WHEELS` → the letters of the hero physically split-flap to `WHICH ROAD NEXT?` (existing `SplitFlapText`, re-keyed) → board rows swap in a flap cascade → page colors crossfade (~600ms) → if a pass is open, the boarding pass slides out like it's been filed and the **bus ticket tears in** with `pass-enter` variant. Sub-line under the switch: *"SAME ENGINE · NEW ROADS — layovers for the sky, journeys for the ground."*

---

## 5. Design spec — THE OLD BUS TICKET (the artifact judges photograph)

New `src/components/terminal/bus-ticket-card.tsx`. Same props/behavior as `BoardingPassCard` (plan, done, onToggleMission, source) — swap-in, not a rewrite of logic.

**Anatomy (left → right):**

```
┌╌╌╌╌╌╌╌╌┊──────────────────────────────────────────────────────┐
│ ADMIT   ┊ ▓▓ LAYOVER STATE ROADWAYS · WHEELS DIVISION ▓▓    │ ← red band
│ ONE     ┊  KOZHIKODE  ──❯❯──  BENGALURU                      │
│         ┊  ROUTE NH-766 · VIA WAYANAD GHAT · 9 HAIRPINS      │
│ TK NO.  ┊  DATE 10-OCT   VEHICLE KSRTC AIRAVAT   WINDOW  A4  │
│ 044512  ┊  FARE: 4 CHAI + 2 PAROTTA (NON-REFUNDABLE)         │
│ [hole]  ┊  ─ ─ ─ JOURNEY STAGES (tap to punch) ─ ─ ─         │
│         ┊  ○ STAGE 1 · Sulaimani summit        20 MIN        │
│ WINGS/  ┊  ○ STAGE 2 · Dhaba diplomacy        35 MIN        │
│ WHEELS  ┊  ○ STAGE 3 · Windshield cinema       30 MIN        │
│         ┊  ══════ TRAVEL STAMPS (passport, kept) ══════      │
│ serial  ┊  [stamp] [stamp] [stamp] [stamp]                   │
│ barcode ┊  IF LOST, THE ADVENTURE IS STILL YOURS             │
└╌╌╌╌╌╌╌╌┊──────────────────────────────────────────────────────┘
```

- **Left stub**: perforated (existing `perforation-v`), big serial, punched hole, `ADMIT ONE`.
- **Red ink** `#B3331F` on cream; top+bottom twin stripe bands; faint print texture (reuse).
- **Fare joke** generated by AI (`fareJoke` — 1 line, e.g. "6 CHAI + 1 BANANA CHIPS"), fallback static.
- **Journey stages** = the mission list, restyled: `STAGE n` + **punch-hole checkbox** — completing a stage **punches a hole** (pop animation) AND **slams the stamp** (unchanged mechanic, DB round-trip identical).
- **Stamp panel** labeled `TRAVEL STAMPS — YOUR TICKET IS YOUR PASSPORT` — same `StampBadge` grid.
- **TRAIN variant** (same component, vehicle prop): band reads `LAYOVER RAILWAYS · WHEELS DIVISION`, vehicle line `RAIL · VANDE BHARAT · CHAIR CAR`, fare joke "3 CHAI + 1 VADA", stages relabeled `HALT n` optional. One component, two flavors.
- `TRAINING MODE` badge (demo source) and `MISSION CLEAR` states carried over verbatim.

---

## 6. WHEELS input form (journey model)

The big conceptual upgrade: WHEELS plans **journeys**, not stops. Dead hours on a 10-hour KSRTC ride ARE the layover.

| Control | Behavior |
|---|---|
| `FROM` combobox | bus stands + railway stations + highway halts (existing `ROAD_STOPS` + new stations) |
| `TO` combobox | same pool, must differ from FROM |
| `🚌 BUS / 🚆 TRAIN` toggle | filters combobox suggestions (stations first for train), changes ticket flavor + AI prompt |
| `JOURNEY LENGTH` slider | 1–12 hrs (same 60–720 schema window), label in wheels: "TIME ON THE ROAD" |
| Vibe picker | unchanged 5 vibes |

**Route flavor**: map known pairs to highway jokes (Kozhikode→Bengaluru = `NH-766 · VIA WAYANAD GHAT`, Kozhikode→Trivandrum = `COASTAL LINE`, Mumbai→Pune = `EXPRESSWAY`). Unknown pairs get `NH-∞`. Rendered on board/ticket/postcard caption.

**Route joke on ticket**: wings `BED → DXB` becomes wheels `SOFA → NH-766` (routeFrom per mode, already supported).

---

## 7. Data, schema & API changes (surgical)

**`planSchema`** (+2 optional fields, fully back-compatible):
```ts
vehicle: z.enum(["bus","train"]).optional(),          // wheels only
destination: z.object({ city: z.string().min(1),       // wheels only
                        code: z.string().optional() }).optional(),
```

**`prisma/schema.prisma`** — Trip gains 2 nullable columns, then `bun run db:push`:
```prisma
vehicle      String?   // "bus" | "train" (wheels)
destination  String?   // "Bengaluru" (route label pair with city)
```
Wall display rule: `trip.destination ? "${city} → ${destination}" : city`. Old rows unaffected.

**`/api/ai/plan`**:
- body adds `vehicle`, `destination { city, code }`; wheels forces `vehicle` default `"bus"`.
- cache key: `${mode}:${vehicle}:${iata}:${dest}:${durationMin}:${vibe}`.
- `ROAD_SYSTEM_PROMPT` upgraded → **ROUTE CONTROL, journey mode**: missions spread across the ride — boarding chaos, meal halt, ghat section, junction wait, window-seat watch, arrival stretch. Bus wisdom (conductor chai, last-row culture, roof-luggage economy, bus-TV movies) vs train wisdom (long junction halts, pantry car, platform vendors, coach-position politics, bookstalls). Locations phrased on-journey: "at the Salem meal halt", "window seat, row 12", "platform 2 during the 20-min halt at Calicut".
- Hard-correct `vehicle`/`destination` post-parse (same pattern as airport today).
- Demo locker gets **3 bespoke wheels journeys + 1 generic**:
  1. `WH-BUS-1` Kozhikode→Bengaluru · KSRTC Airavat · 10h · foodie (NH-766 ghat hero)
  2. `WH-TRAIN-1` Kozhikode→Thiruvananthapuram · Vande Bharat · 5h · explorer
  3. `WH-BUS-2` Mumbai→Pune · Expressway · 4h · maxout
  4. `genericWheelsPlan(origin, dest, vehicle, vibe)` fallback
- Demo keying: `DEMO_WHEELS: { "KBS>MJS": plan, "CLT>TVC": plan, "BOM>PNQ": plan }` — forceDemo matches pair, else generic.

**Stops dataset** (`airports.ts`): add `kind?: "bus"|"train"|"halt"` + ~6 railway stations (Kozhikode CLT, Ernakulam Jn ERS, Thiruvananthapuram TVC-rail, KSR Bengaluru SBC, Chennai Central MAS, Mumbai CSMT). Combobox vehicle filter. Offline search unchanged.

**Postcard & announce**: add wheels branch — postcard prompt "vintage Indian highway travel poster, gouache, winding ghat road, red-and-cream bus / rail line through coconut groves"; announce becomes conductor call: *"Attention please — the Kozhikode to Bengaluru service is now boarding at platform infinity. Four journey stages, ten hours on the road. Chai is not optional. Wheels control, out."*

---

## 8. Build order & time budget (after you say go)

| Phase | Work | Time |
|---|---|---|
| **A** | Renames (MODE_META labels WINGS/WHEELS, hero, ticker, footer, board rows, wall chips) + stops dataset (stations) + schema fields + `db:push` | ~45m |
| **B** | API: plan route (vehicle/destination, journey prompt, demo journeys, cache key) + postcard/announce branches | ~40m |
| **C** | WHEELS theme engine: `data-mode` tokens, sign-green board + planner + button + hazard utilities, crossfade | ~60m |
| **D** | Journey form (FROM/TO + BUS/TRAIN toggle) + **bus ticket component** with punch-holes + train variant | ~75m |
| **E** | Transition choreography (flap flip, pass↔ticket swap) + wheels demo journeys copy-polish | ~30m |
| **F** | Verify (lint + curl both modes + agent-browser golden paths) + docs (`docs/features/07-wings-wheels.md`, worklog, README/EXPLAINER patches) | ~45m |

**Total ≈ 5h**, leaving plenty of night for pitch prep, photos, and sleep-based hubris.

## 9. Verification checklist (Phase F)

- [ ] `bun run lint` clean
- [ ] `curl forceDemo` wheels: bus `KBS→MJS` + train `CLT→TVC` instant, correct ticket data
- [ ] Live AI wheels journey (network willing), `source:"ai"`
- [ ] Browser: flip WINGS⇄WHEELS → full skin flip, no hydration errors
- [ ] Wheels golden path: plan → ticket → complete stage → punch + stamp slam → postcard → announce → wall chip
- [ ] Wings golden path regression (amber world unbroken, `BED → DXB` intact)
- [ ] Demo toggle works in **both** modes; offline airport search intact
- [ ] Mobile width: ticket stub stacks, board scrolls, footer sticky

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Model ignores `vehicle` | vehicle named twice in prompt + hard-corrected post-parse; demo plans carry flavor |
| Theme flip breaks wings styling | wings is the default token set; wheels overrides scoped under `[data-mode="road"]` only |
| DB push surprises | only nullable additive columns; old trips render as WINGS |
| Time sink on ticket art | ticket is self-contained; if late, ship cream+red minimal version first, puns later |
| Split-flap alphabet gaps | hero texts use chars already proven (`WHERE TO NEXT?` pattern) |

## 11. Docs after build (protocol)

- `docs/features/07-wings-wheels-highway-mode.md` (template-compliant)
- `worklog.md` Task entry
- README feature ladder + EXPLAINER "two worlds" section
