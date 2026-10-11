# 🛠 HACKATHON NIGHT — BUILD HANDOFF
> Read this at 5:00 PM at TinkerSpace before the 6:00 PM start.
> The base (toolkit) is DONE and verified. Tonight you build the PRODUCT on top of it.

## WHAT EXISTS (pre-built toolkit — verified working)

### Design system "Night Terminal"
- Near-black bg + departure-board amber + paper-cream passes. Fonts: Sora + Space Mono.
- All tokens in `src/app/globals.css`. Signature CSS: `.flap-cell` (split-flap), `.perforation-v/h` + `.notch` (pass perforation), `.barcode`, `.qr-blocks`, `.stamp-slam`, `.pass-enter`, `.board-glow`, `.ticker`.

### Components (`src/components/terminal/`)
| Component | What it does | Tonight's use |
|---|---|---|
| `departure-board.tsx` | Split-flap hero + departures table, auto-cycling | Landing hero — change BOARD_ROWS text for final narrative |
| `boarding-pass-card.tsx` | THE artifact: paper pass, route BED→IATA, meta chips, missions, stamps, barcode | The core of the demo. Tweak copy/props freely |
| `airport-combobox.tsx` | Offline search over 70 airports, keyboard nav | Input step |
| `duration-slider.tsx` | 1h–12h window + presets | Input step |
| `vibe-picker.tsx` | 5 vibes feed the AI prompt | Input step |
| `mission-timeline.tsx` | T+ times, category icons, complete buttons, tips | Inside pass (light=true) or standalone |
| `stamp-badge.tsx` | SVG rubber stamps, slam animation, ghost state | Gamification — tonight: maybe add sounds |
| `generation-status.tsx` | Theatrical "CONTACTING GATE CONTROL…" lines | Keep — it turns AI latency into showmanship |

### AI pipeline (all tested with curl, all have fallbacks)
| Route | Function | Fails → |
|---|---|---|
| `POST /api/ai/plan` | LLM → strict-JSON plan (zod-validated), 10-min in-memory cache | demo plan (source:"demo", TRAINING MODE badge) |
| `POST /api/ai/postcard` | Vintage postcard image (~50s) | `{source:"none"}` → UI shows "press jammed" card |
| `POST /api/ai/announce` | TTS "jam" voice WAV | 503 → UI toast |
| `GET /api/airports?q=` | search | (client uses offline dataset anyway) |
| `POST/GET /api/trips` | archive + wall of adventures | — |
| `PATCH /api/missions/[id]` | toggle done → mints/deletes stamp | — |

### Data
- Prisma: `Traveler → Trip → Mission → Stamp` on SQLite (`db/custom.db`). Already pushed.
- Demo locker: `src/lib/demo-mode.ts` — DXB / SIN / CCJ bespoke plans + generic fallback + `GATE_CONTROL_LINES`.

### The demo-safety stack (your 8 AM insurance)
1. Demo mode toggle (header + footer) → instant pre-baked plan, TRAINING MODE badge.
2. AI failure → automatic demo fallback with toast.
3. Total network failure → client-side `genericDemoPlan` — the demo CANNOT die.

## 🚨 THE PIVOT (announced at kickoff): THEME = ALL TRAVEL — AIR ⇄ ROAD IS BUILT

The theme is NOT limited to air travel. We already shipped the answer: a **transport-mode engine**.
Flip the AIR/ROAD switch and the entire terminal re-skins live — split-flap board re-flips to bay rows,
boarding pass becomes a ROAD PASS (DOOR → KBS), gate lines become conductor lines, the AI swaps personas
(GATE CONTROL → ROUTE CONTROL), missions become sulaimani summits, bay-board bingo and dhaba diplomacy.

**This IS the demo now — the transition is the showpiece:**
1. Generate an air plan for the judge's airport (e.g. DXB).
2. Flip to ROAD while they watch — the whole terminal flips. "Same engine. New roads."
3. Generate KBS (Kozhikode KSRTC — home turf) or their city's bus stand.
4. Line: *"Flyers wait in terminals. Everyone else waits in bus stands. Dead hours don't care how you travel."*

What exists (all verified): `src/lib/modes.ts` (registry), 14 ROAD_STOPS in `airports.ts`, ROAD_DEMO_PLANS
(KBS + MJS) + `genericRoadPlan`, mode-aware `/api/ai/plan` (ROAD_SYSTEM_PROMPT), `Trip.mode` in DB,
mode-filtered search, ModeSwitch component, mode-aware pass/board/status/combobox, wall mode badges.
Docs: `docs/features/07-transport-modes.md`. Road demo mode: toggle DEMO + pick KBS/MJS = instant.

**Mode extension ideas tonight (pick ONE if time):** RAIL mode (registry entry + stops + prompt — recipe in doc 07),
per-mode accent color, road-specific postcard already done (bus on highway scene).

## TONIGHT'S BUILD ORDER (6:00 PM → 6:00 AM)

### Leg 1 — 6:00–8:30 · THE SPINE (highest priority)
1. Read this file, run `bun run dev`, click through the whole flow once.
2. Decide the final narrative + rename any copy that needs it (keep "LAYOVER" name!).
3. Improve the AI prompt in `api/ai/plan/route.ts` SYSTEM_PROMPT — this is your product's soul:
   - Make missions airport-specific (mention real terminal features per airport).
   - Test 3 airports, tune temperature/vibe hints.
4. Add **mission completion → stamp slam sound** (1 free sound from pixabay, `<audio>` on toggle).
5. Commit every 20 minutes: `git log` is your "built tonight" evidence for judges.

### Leg 2 — 9:00–11:00 · THE DELIGHT
6. **Passport view**: "MY PASSPORT" section — all stamps across all trips (query `db.stamp` by traveler). Even a simple grid = wow.
7. **Postcard auto-flow**: generate postcard automatically when pass issues (don't wait for button) — but keep button too.
8. **Announcement auto-play**: play TTS when the pass first renders (muted-until-click rule: browsers block autoplay — trigger on the REQUEST ADVENTURE click's completion).
9. Polish mobile pass — judges WILL hold phones up.

### Leg 3 — 11:00–12:30 · THE MAGIC EXTRAS (pick 2, not all)
- **Delay re-planner**: "+45 MIN DELAY" button → regenerate with durationMin+45, animate the pass re-stamping. GREAT story beat for Round 2.
- **Layover lottery**: random airport button — "FEELING LUCKY" spins the globe.
- **Share card**: download the pass as PNG (html2canvas or just screenshot instructions).
- **Wall upgrade**: auto-rotating wall on a second screen/tablet at the booth.

### Leg 4 — 12:30–2:00 · HARDENING
10. Run the full flow on **phone hotspot**, not just venue wifi.
11. Toggle demo mode ON, run the ENTIRE 2-min pitch against demo mode. It must be flawless.
12. Error states: kill the dev server mid-demo, restart, confirm recovery.
13. Charge everything. `git push`.

### Leg 5 — 2:00–4:00 · BOOTH KIT + PITCH
14. Print pass postcards (screenshot the pass on paper bg, print A6). QR → your preview URL.
15. Booth one-liner card: "TYPE YOUR AIRPORT. GET AN ADVENTURE."
16. Write + rehearse pitches (below). ×3 each, timed.

### Leg 6 — 4:00–6:00 · FREEZE
17. 20-min nap. Final smoke test. Feature freeze — bugfixes only.

## PITCHES (memorize)

### Round 1 — booth (30 sec)
"Judges spend 60 seconds per project tonight — travelers spend 5 hours staring at departure boards. We came to LAYOVER, so we built LAYOVER: type any airport and your layover length, and our AI turns dead hours into a mission-based micro-adventure — timed around security buffers, stamped into a passport you keep forever. Try it — what's your home airport?"

### Round 2 — panel (2 minutes)
- 0:00 "We came to LAYOVER, so we built LAYOVER." (beat) "Every traveler knows the dead hours — the 5-hour gap where you just… wait. We made waiting the best part of flying."
- 0:20 LIVE: ask a judge for their home airport. Generate. Narrate the theatrical status lines.
- 1:00 Fast tour: "Missions timed around your security buffer. Complete one — watch the stamp. Your adventure becomes a boarding pass. An AI postcard. A gate announcement."
- 1:30 "Built overnight: Next.js, an LLM plan engine, image and speech AI, a Postgres-grade data model — every mission on this pass was generated in the last 12 hours. Like us."
- 1:50 "Every layover deserves an adventure. LAYOVER — built overnight, at LAYOVER."

## JUDGE QUESTION PREP
- **"Did you pre-build this?"** → "We prepared a toolkit — design system, AI integrations, fallbacks. Every product feature, every mission, the gamification was built tonight. Our commit log shows it." (Keep commits dense!)
- **"Is the AI reliable?"** → "That's why demo mode exists — flip the switch, the full experience runs from a local adventure locker. An 8 AM demo should never depend on wifi."
- **"Business model?"** → "The judges said it doesn't need one — but airport lounges, tourism boards, and airlines would pay to be missions."

## QUICK COMMANDS
```bash
bun run dev          # already running on :3000
bun run lint         # keep it green
bun run db:push      # after schema changes
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"SIN","durationMin":260,"vibe":"maxout"}' | python3 -m json.tool  # sanity check
```

## FILES MAP
```
PLAN.md                    ← strategy (rubric math, battle plan)
HACKATHON-NIGHT.md         ← this file
src/lib/airports.ts        ← airport dataset (add more if needed)
src/lib/plan-schema.ts     ← zod contract + category colors
src/lib/demo-mode.ts       ← demo plans + gate-control lines (personalize!)
src/app/api/ai/plan/       ← SYSTEM_PROMPT lives here — tune it first
src/components/terminal/   ← all 8 components
prisma/schema.prisma       ← Trip/Mission/Stamp models
```

GO WIN DUBAI. 🛫
