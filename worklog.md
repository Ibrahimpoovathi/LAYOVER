# Worklog

---
Task ID: 1
Agent: Z.ai Code (main)
Task: Research LAYOVER 2026 hackathon, produce winning strategy + build the pre-event base toolkit

Work Log:
- Fetched and parsed https://tinkerhub.github.io/layover/ (page_reader returned empty; used raw HTML extraction via curl)
- Decoded event: 10–11 Oct 2026, TinkerSpace Calicut, 6PM–6AM build, 50-mark rubric (built 20 / creativity 10 / travel-connection 10 / execution 5 / demo 5), two-round judging (~20 finalists), solo/duo, AI tools allowed, winner gets Dubai trip
- Wrote full strategy to PLAN.md: product direction "LAYOVER — turn layovers into AI missions", rubric traceability, tonight's hour-by-hour plan, pitches, risk register
- Loaded LLM / image-generation / TTS skill docs; confirmed SDK APIs (chat.completions, images.generations, audio.tts)
- Built "Night Terminal" design system in globals.css (amber/near-black/paper, split-flap CSS, perforation, barcode, stamp-slam, ticker)
- New layout with Sora + Space Mono, favicon.svg
- src/lib/airports.ts — 70-airport offline dataset (India-boosted search, CCJ included)
- src/lib/plan-schema.ts — zod contract (Plan/Mission/CATEGORY_META/fmtDuration/missionOffsets)
- prisma/schema.prisma — Traveler/Trip/Mission/Stamp; db:push OK
- API routes (all curl-tested): ai/plan (LLM strict-JSON + zod + 10-min cache + demo fallback), ai/postcard (image, 1344x768), ai/announce (TTS jam voice WAV), airports, trips (POST/GET wall), missions/[id] (toggle → mint/delete stamp)
- src/lib/demo-mode.ts — DXB/SIN/CCJ demo plans + generic fallback + GATE_CONTROL_LINES
- Components: departure-board (split-flap cells + auto-cycling rows), airport-combobox (offline keyboard nav), duration-slider, vibe-picker, mission-timeline (light/terminal variants), stamp-badge (SVG textPath stamps), boarding-pass-card (paper pass, BED→IATA, perforation, stub, stamps), generation-status (theatrical overlay)
- page.tsx: full flow — hero board, planner, generation, pass + stamps + postcard + announce, wall of adventures, sticky footer, demo toggle
- Fixed: demo mode bypassing cache (bug found via browser test); react-hooks lint errors (derived state); removed unused directive
- Browser-verified (agent-browser): desktop + mobile (390px) renders, combobox → DXB live generation (6.8s), pass render, mission toggle → MOVE stamp slam, demo mode instant with TRAINING MODE badge, announce/postcard buttons error-free, wall persistence, footer sticky, zero console errors
- Wrote HACKATHON-NIGHT.md — the 6PM–6AM build handoff with prompts, priorities, pitches, judge-question prep

Stage Summary:
- Base toolkit COMPLETE and verified end-to-end before the 5 PM check-in
- Product deliberately NOT finished: missions logic tuning, passport view, sounds, share card, delay re-planner = tonight's work (per event FAQ "meaningful progress during the hackathon")
- Demo-safety stack proven: demo toggle / API fallback / client-side fallback — 8 AM demo cannot die
- Key artifacts: PLAN.md (strategy), HACKATHON-NIGHT.md (night build guide), src/components/terminal/* (8 components), 6 API routes, 4 Prisma models
- Demo flow for judges: pick airport → REQUEST ADVENTURE → theatrical status → boarding pass → complete mission → stamp slams → postcard + announcement
---
Task ID: 2-a
Agent: frontend-styling-expert (subagent)
Task: Write feature docs 01-night-terminal-design-system.md and 04-boarding-pass-experience.md

Work Log:
- Read worklog.md, docs/README.md (template), PLAN.md §2–§3, package.json (scripts/deps)
- Read source: globals.css, layout.tsx, boarding-pass-card.tsx, stamp-badge.tsx, mission-timeline.tsx, generation-status.tsx, plan-schema.ts, page.tsx, demo-mode.ts (GATE_CONTROL_LINES), package.json
- Grepped src/**/*.tsx to build accurate "used by" columns for every signature CSS class
- Wrote docs/features/01-night-terminal-design-system.md — full :root token table (real hex), Sora/Space Mono font pipeline via next/font + @theme inline, all 16 signature classes w/ usage notes (--stamp-rot, duplication requirement for .ticker), no-blue rule rationale, dark-only note, scrollbar/background treatment, 6 recipes, 9-row troubleshooting table, verify steps
- Wrote docs/features/04-boarding-pass-experience.md — data flow page.tsx→pass→stamp with real prop names (plan/done/onToggleMission/source/missionIds), passId hash internals, stamp-badge SVG anatomy (textPath, ROTATIONS, useId), missionOffsets buffer math, GenerationStatus 1.1s line cycle, CATEGORY_META color table, 5 extend recipes (share-card, stamp sound, copy edits, delay re-planner key remount, passport gallery), 8-row troubleshooting, demo-mode click-path verification

Stage Summary:
- Two template-compliant feature docs created (~140 and ~120 lines, all claims traced to source)
- Code observations (no code changed): --color-safe is mapped in @theme inline but --safe is never defined in :root, so bg-safe/text-safe are dead utilities (documented); a handful of hard-coded hexes in components (#8a6d3b, #2d7d74, #c2452d…) mirror CATEGORY_META values — flagged as "don't add more"; docs/features/ still missing 02/03/05/06 per the README index
- No source/config files modified; worklog appended only
---
Task ID: 2-b
Agent: general-purpose (subagent)
Task: Write feature docs 03-ai-mission-pipeline.md and 05-demo-mode-fallback-chain.md

Work Log:
- Read worklog.md, docs/README.md (template), PLAN.md §3 before writing (docs convention: all sections + real names/paths/runnable curls, <250 lines)
- Read all source under documentation: api/ai/plan/route.ts, api/ai/postcard/route.ts, api/ai/announce/route.ts, lib/plan-schema.ts, lib/demo-mode.ts, lib/airports.ts, app/page.tsx; plus grep of boarding-pass-card.tsx (TRAINING MODE badge = source === "demo") and generation-status.tsx (GATE_CONTROL_LINES @1100ms)
- Wrote docs/features/03-ai-mission-pipeline.md (139 lines): full request/response contracts for plan/postcard/announce, the 10-step plan flow (validate → forceDemo short-circuit → 10-min Map cache → ZAI + 48s race → extractJson → zod → hard-correction → cache.set → source:"ai" / catch → demo + note), full planSchema/missionSchema limits table, SYSTEM_PROMPT design rules, endpoint reference table with cache/timeout column, 5 extend recipes, 7-row troubleshooting table, 6 curl verifications against localhost:3000
- Wrote docs/features/05-demo-mode-fallback-chain.md (89 lines): 3-layer safety model with exact mechanics, demo-mode.ts exports table (DEMO_PLANS DXB/SIN/CCJ summaries, genericDemoPlan, GATE_CONTROL_LINES, fakeStreamChunks), why DXB/SIN/CCJ exist, "demo never reads cache" rule, 5 extend recipes (new bespoke plan, theatrical lines, shift+D shortcut, offline test, streaming demo), troubleshooting, curl + UI + DevTools-offline verification

Stage Summary:
- Artifacts: docs/features/03-ai-mission-pipeline.md, docs/features/05-demo-mode-fallback-chain.md; no source/config files touched
- Surprises noted in docs: SYSTEM_PROMPT is sent as role "assistant" (not "system") in plan route; prompt limits are softer than zod (prompt says 2–5 missions/buffer ≤150, zod allows 2–6/buffer ≤180 — zod is the real enforcer); demoFallback never shrinks totalDurationMin below the baked plan window (Math.max); demo path skips planSchema.parse (no runtime guard on pre-baked plans); postcard failure is HTTP 200 source:"none" while announce failure is the only 503; page.tsx mobile demo toggle lives in the footer (sm:hidden), desktop in header
---
Task ID: 2-c
Agent: general-purpose (subagent)
Task: Write feature docs 02-input-flow-and-airport-data.md and 06-database-and-wall.md

Work Log:
- Read worklog.md, docs/README.md (template), PLAN.md §3, then all 12 target sources (airports.ts, api/airports, combobox, slider, vibe-picker, departure-board, schema.prisma, db.ts, trips route, missions/[id] route, api/route.ts, page.tsx) plus plan-schema.ts and ai/plan route for cross-references
- Wrote docs/features/02-input-flow-and-airport-data.md (117 lines): Airport type + real dataset count (74, not 70), scoring tiers table (+6 India boost), findAirport, /api/airports contract (client never calls it — offline by design), combobox keyboard/140ms-blur behavior, slider 60–720/step15 + PRESETS, 5 vibes, FlapCell/SplitFlapText/DepartureBoard mechanics + BOARD_ROWS location, generate() request body
- Wrote docs/features/06-database-and-wall.md (143 lines): all 4 Prisma models field-by-field, relation graph + stamp semantics (mint on done/delete on untoggle, missionId@unique), db.ts singleton, POST/GET /api/trips + PATCH /api/missions/[id] exact behavior, real triggers in page.tsx (saveTrip fires only on successful /api/ai/plan; client-side fallback path does NOT archive), zod limits reference table, 5 extend recipes, troubleshooting table
- Verified live against running dev server: curl /api/airports?q=koz → CCJ ✅; validated the doc's trips payload against real planSchema via bunx tsx (VALID); executed full POST /api/trips → GET ?limit=3 → PATCH done:true (stamp ink #2d7d74, category explore) → PATCH done:false (stamp null) cycle ✅; then deleted the doc-tester trip+traveler (cascades) so the DB is exactly as found

Stage Summary:
- Artifacts: docs/features/02-input-flow-and-airport-data.md + docs/features/06-database-and-wall.md (both follow the docs/README.md template, under 250 lines, with runnable verified curls)
- Surprise 1: AIRPORTS has 74 entries, not the ~70 claimed in worklog/PLAN (18 India / 8 Gulf / 19 Asia / 14 Europe / 8 Americas / 3 Oceania / 4 Africa)
- Surprise 2: Port Blair is stored with iata "IXC2" (4 chars, real code IXZ) — search works but planSchema.airport.iata requires exactly 3 chars, so Port Blair plans would never archive to the wall (saveTrip fails silently). Fix = one-line rename in airports.ts (documented in doc 02 recipes/troubleshooting)
- Surprise 3: stamps "not minting" can't be a CATEGORY_META issue — the PATCH route falls back to chill ink for unknown categories; the real cause is an unarchived trip (missionIds empty), which is what the doc's troubleshooting says
---
---
Task ID: 2
Agent: Z.ai Code (main)
Task: Build the documentation system — main README, docs/ convention, per-feature deep-dive docs (user request: detailed readme + worklog + separate readme per major feature for future reference and error fixing)

Work Log:
- Audited state: base toolkit from Task 1 complete + verified; dev server running
- Wrote README.md (150 lines): quickstart, 30-sec demo script, architecture tree, API reference table, demo-mode safety, Night Terminal token cheat-sheet, feature ladder, documentation protocol, troubleshooting quick hits
- Wrote docs/README.md: documentation convention (when to create a feature doc, exact template, quality bar), index of feature docs, worklog discipline
- Dispatched 3 parallel doc agents: 2-a → docs 01 (design system) + 04 (boarding pass); 2-b → docs 03 (AI pipeline) + 05 (demo mode); 2-c → docs 02 (input flow) + 06 (database/wall)
- All 6 feature docs follow the template: TL;DR / rubric tie / files / how it works / reference / extend-tonight recipes / symptom→cause→fix troubleshooting / paste-run verification
- Fixed 2 real bugs found by doc agents while reading code:
  1. airports.ts: Port Blair IATA "IXC2" (4 chars, invalid) → "IXZ" — such trips would silently fail planSchema length(3) and never archive
  2. globals.css: added missing --safe token (#3fa66a) that --color-safe mapped to (dead bg-safe utility)
- Verified: bun run lint clean; curl smoke tests — health OK, IXZ search OK, forceDemo instant with correct DXB plan, live AI plan for AMS source:"ai" with 4 missions
- Browser-verified golden path (agent-browser): page loads with zero console errors → demo toggle ON → DXB → TRAINING MODE badge → pass with 4 demo missions → complete mission → button flips to Undo (PATCH round-trip works)

Stage Summary:
- Documentation system live: README.md + docs/README.md + 6 feature deep-dives (~960 doc lines total); every future feature/change gets docs/features/NN-slug.md per convention
- 2 latent data/token bugs fixed and verified live
- App re-verified end-to-end after fixes: lint clean, APIs green, browser golden path green
---
Task ID: 3
Agent: Z.ai Code (main)
Task: Write a plain-English (layman) explanation of the site and its complete working, in an md file

Work Log:
- Wrote EXPLAINER.md (~190 lines): big idea in 30 seconds, full walk-through of everything visible on the page (flip board, form, button, pass, stamps, postcard, announcement, wall, demo switch), the press-the-button journey told as a restaurant analogy (order → waiter → chef texts AI writer → teacher checks homework → photocopy drawer fallback → plate out → diary entry), a cast-of-characters table mapping plain names to technical files, the 3-umbrella offline safety story, a plain-language journey map, and an FAQ
- Added EXPLAINER.md to the docs index in docs/README.md and to the documentation table in README.md
- Docs-only change: no source code touched, no re-verification needed

Stage Summary:
- EXPLAINER.md is the non-technical narrative doc — usable to brief teammates, explain to mentors/judges who ask "so what does it do?", or onboard a friend to help tonight
- Every technical term is introduced after its plain-English translation; tech names appear only in the reference table

---
Task ID: 4-b
Agent: general-purpose (subagent)
Task: Write feature doc 07-transport-modes.md for the AIR ⇄ ROAD mode engine

Work Log:
- Read worklog.md, docs/README.md (exact template), then all 8 mode-engine sources before writing: src/lib/modes.ts, src/lib/airports.ts (ROAD_STOPS / ALL_STOPS / searchAirports 3rd param), src/lib/plan-schema.ts (MODE_IDS + optional planSchema.mode), src/lib/demo-mode.ts (ROAD_DEMO_PLANS KBS+MJS, genericRoadPlan, GATE_CONTROL_LINES still exported), src/app/api/ai/plan/route.ts (body.mode, cacheKey mode:iata:durationMin:vibe, ROAD_SYSTEM_PROMPT "ROUTE CONTROL" vs SYSTEM_PROMPT "GATE CONTROL", demoFallback branch, plan.mode hard-correct), src/app/api/trips/route.ts (Trip.mode store/return), src/app/api/airports/route.ts (?mode=), prisma/schema.prisma (Trip.mode String @default("air")); also read docs/features/05 for tone/length calibration
- Wrote docs/features/07-transport-modes.md (112 lines, template-exact): TL;DR; Why it exists (hackathon pivot — theme widened to ALL travel, flip = the demo moment, doubles creativity/travel-connection marks); Files table (8 sources + component layer marked 🚧); How it works (5-step mode flow: switch → re-skin via MODE_META + DepartureBoard re-key → mode-aware search (s.mode ?? "air" pool filter) → mode-aware persona → same zod/stamps/wall, plus mode-aware fallback chain incl. demo-never-reads-cache); Reference (full ModeMeta air-vs-road field table, 14 ROAD_STOPS list, mode-aware API table, component prop table from spec: ModeSwitch radiogroup/amber/44px, firstColLabel, lines, passTitle/passSubtitle/routeFrom DOOR, combobox mode+placeholder, page.tsx behaviors); Extend tonight (RAIL MODE in 6 steps + WATER + per-mode accents + per-mode board rows, with the /api/trips road-air ternary widening caveat); 7-row troubleshooting (search shows airports, air missions in road mode, old wall trips = default column, ROAD_DEMO_PLANS key mismatch, cache flush restart, zod mode enum, db:push); Verify (4 curls: road search, KBS forceDemo, MJS live, DXB air regression + browser click-path to ROAD PASS)
- Added ONE row to docs/README.md "Index of feature docs": | 07 | 07-transport-modes.md | AIR ⇄ ROAD mode engine, road stops, ROUTE CONTROL persona, mode-aware components |
- Docs-only task: no source code touched

Stage Summary:
- Artifacts: docs/features/07-transport-modes.md + index row in docs/README.md
- All lib/API claims traced to real code read this session (MODE_META 15 fields × 2 modes, 14 road stops, cacheKey format, both SYSTEM_PROMPT personas, hard-correct plan.mode, Trip.mode default "air"); component claims match the parallel-agent spec verbatim and are marked 🚧 "being built in parallel"
- Noted for tonight: /api/trips stores mode via `plan.mode === "road" ? "road" : "air"` ternary — a future rail/water mode needs that widened (flagged in the doc's rail recipe, not changed per task scope)
- Doc count in index now 7 (01–07); feature doc is 112 lines (dense tables), under the ~250 cap
---
---
Task ID: 4-a
Agent: frontend agent (subagent)
Task: Make component layer mode-aware for AIR ⇄ ROAD transition

Work Log:
- Read worklog.md, docs/README.md, lib/modes.ts (MODE_META / MODE_LIST / TransportMode), lib/airports.ts (searchAirports optional 3rd mode param, StopMode), and all 5 target component files before editing
- CREATED src/components/terminal/mode-switch.tsx — "use client" AIR⇄ROAD segmented control with exact signature ModeSwitch({ mode, onChange }: { mode: "air" | "road"; onChange: (m: "air" | "road") => void }); registry-driven from MODE_LIST, Plane/Bus icon via m.icon ternary, role=radiogroup("Transport mode") + per-button role=radio/aria-checked/aria-label("Air mode"/"Road mode"), min-h-11 (44px) px-4 targets, font-mono text-xs font-bold tracking-[0.25em] with meta.label, amber-only active state bg-primary text-primary-foreground + shadow-[0_0_16px_-4px_rgba(245,166,35,0.8)], inactive text-muted-foreground hover:text-foreground, container inline-flex rounded-lg border border-border bg-card/60 p-1, transition-all duration-200, cn() for class merge
- EDITED departure-board.tsx — added ONE optional prop firstColLabel (default "FLIGHT") to DepartureBoard and used it in the desktop header grid first column; nothing else touched
- EDITED generation-status.tsx — added ONE optional prop lines (default GATE_CONTROL_LINES, import kept); both usages (interval modulo + displayed text) now read `lines`; effect dep array now [lines] so the interval re-arms per line set. DEVIATION (lint-forced): the "reset line to 0 when lines identity changes" could NOT be setLine(0) inside the effect — repo lint (react-hooks/set-state-in-effect from eslint-config-next) errors on synchronous setState in effects; implemented instead as React's documented render-time state adjustment (prevLines state + identity compare → setPrevLines(lines); setLine(0)). Behavior identical: cycle restarts at line 0 on mode switch
- EDITED boarding-pass-card.tsx — added optional passTitle (default "BOARDING PASS"), passSubtitle (default "LAYOVER TERMINAL"), routeFrom (default "BED"); replaced the card's hard-coded equivalents: header overline "LAYOVER ADVENTURE PASS" → {passTitle}, issuer line "GATE CONTROL ISSUE" → {passSubtitle} (kept "{passId} · " prefix and styling), route origin "BED" → {routeFrom}. Zero styling/logic changes; existing props (plan, done, onToggleMission, source) untouched. NOTE: unwired render now shows "BOARDING PASS"/"{passId} · LAYOVER TERMINAL" instead of the old copy — page.tsx must pass MODE_META[mode].passTitle/passSubtitle/routeFrom when wiring
- EDITED airport-combobox.tsx — added optional mode ("air" | "road"); BOTH search branches now thread mode as the 3rd searchAirports arg: query branch searchAirports(query, 8, mode) and empty-query branch searchAirports("", 6, mode) (replaced hard-coded AIRPORTS.slice(0, 6) so road mode surfaces bus stands on open — output is byte-identical to before for air/undefined since ALL_STOPS starts with AIRPORTS; removed the now-unused AIRPORTS import). The hard-coded sr-only label "Departure or layover airport" now renders the placeholder prop; input placeholder default stays "City, airport or code…" so unwired visuals are unchanged
- Verification: bun run lint → clean, 0 errors; bunx tsc --noEmit → 0 errors in src/ (only pre-existing errors in examples/ + skills/ sandbox dirs, which are outside the app and eslint-ignored). page.tsx untouched and still compiles (all new props optional)

Stage Summary:
- Component layer is mode-aware and ready for page.tsx wiring. Exact exports/props for the main agent:
  - import { ModeSwitch } from "@/components/terminal/mode-switch" → <ModeSwitch mode={mode} onChange={setMode} /> (mode: "air" | "road"; onChange: (m: "air" | "road") => void)
  - <DepartureBoard rows={rows} firstColLabel={meta.firstColLabel} /> — optional, defaults "FLIGHT"
  - <GenerationStatus airportLabel={...} lines={meta.statusLines} /> — optional, defaults GATE_CONTROL_LINES
  - <BoardingPassCard plan done onToggleMission source passTitle={meta.passTitle} passSubtitle={meta.passSubtitle} routeFrom={meta.routeFrom} /> — all optional, defaults "BOARDING PASS" / "LAYOVER TERMINAL" / "BED"
  - <AirportCombobox value onSelect mode={mode} placeholder={meta.stopPlaceholder} /> — both optional
- Suggested wire map (all from MODE_META[mode]): firstColLabel, statusLines, passTitle, passSubtitle, routeFrom, stopPlaceholder
- Known deviations for the main agent: (1) GenerationStatus reset is render-time adjustment, not setState-in-effect (lint ban); (2) combobox empty-query dropdown is now mode-filtered (air behavior identical, road shows KBS/VYT/THP/…); (3) boarding-pass header copy changes if props unwired; (4) combobox's decorative Plane icon NOT mode-swapped (out of scope per "nothing else changes" — 1-line swap with meta.icon if wanted later)
---
Task ID: 4
Agent: Z.ai Code (main)
Task: Hackathon kickoff pivot — theme widened to ALL travel; implement the AIR ⇄ ROAD transport-mode transition on top of the completed air LAYOVER product

Work Log:
- Read page.tsx, departure-board, generation-status, airports.ts, airports API before editing
- Created src/lib/modes.ts — transport-mode registry (TransportMode, ModeMeta, MODE_META, MODE_LIST, ROAD_CONTROL_LINES): hero text, board labels, pass title/subtitle, route joke (BED→ / DOOR→), status lines, announce phrasing per mode
- airports.ts: +14 ROAD_STOPS (KBS Kozhikode KSRTC, VYT Kochi, THP TVM, QLN Kollam, TCR Thrissur, KNR Kannur, ALP Alappuzha, MJS Bengaluru Majestic, CMT Chennai CMBT, GPM Coimbatore, MYS Mysuru, RSP/NHT/DHB highway halts); searchAirports(query, limit, mode?) pool filter; ALL_STOPS; findAirport searches all
- plan-schema.ts: +MODE_IDS/PlanMode; planSchema gains optional mode (backwards compatible)
- demo-mode.ts: +ROAD_DEMO_PLANS (KBS "The Mavoor Road Miniseries", MJS "Operation Majestic") + genericRoadPlan; air plans untouched
- api/ai/plan: mode-aware — cacheKey mode:iata:durationMin:vibe, ROAD_SYSTEM_PROMPT ("ROUTE CONTROL" persona: bus stands, dhabas, crew-chai diplomacy), demoFallback branches by mode, plan.mode hard-corrected; air demo fallback now spreads explicit mode
- prisma Trip.mode @default("air") + db:push; api/trips stores/returns mode; api/airports ?mode= filter; api/ai/postcard road scene (bus on highway vs airplane)
- Task 4-a (subagent): mode-switch.tsx (new), departure-board firstColLabel, generation-status lines prop, boarding-pass-card passTitle/passSubtitle/routeFrom props, airport-combobox mode+placeholder — lint clean
- Task 4-b (subagent): docs/features/07-transport-modes.md + docs index row
- page.tsx wired: mode state + switchMode (clears mismatched stop), ModeSwitch above hero, SplitFlapText/DepartureBoard/ticker re-keyed by mode (full re-skin moment), ROAD_BOARD_ROWS (RT-20x, DUBAI row kept), planner heading/status per mode, plan request carries mode, client fallback branches genericDemoPlan/genericRoadPlan, pass renders in plan's OWN mode (passMeta), announcement uses announceKind, wall shows ✈/🚌 badges, footer v2 AIR⇄ROAD
- Verified: lint clean; curls — air demo (mode:air), road demo KBS, road generic RSP, road search filter, live road AI MJS (source:ai, "Kempegowda Chronicles", Platform Archaeology/Conductor's Confab missions)
- Browser-verified: air render → flip ROAD → full re-skin (WHERE THE ROAD WAITS?, RT-20x bay board, FILE YOUR ROAD PLAN, bus-stand combobox) → demo KBS → ROAD PASS + TRAINING MODE + Sulaimani summit → mission toggle stamps → flip back AIR → hero restores, pass keeps road identity; zero console errors
- Docs: HACKATHON-NIGHT.md "THE PIVOT" section (transition = the demo now, 4-beat judge flow, mode extension ideas); README updated (tagline, demo script, arch, API table, demo plans, feature ladder)

Stage Summary:
- LAYOVER is now mode-agnostic: one mission engine, two worlds — air (GATE CONTROL) and road (ROUTE CONTROL)
- The live AIR⇄ROAD re-skin is the Round-2 showpiece: flip switch → board re-flips → persona swaps → road missions
- Road demo-safety: KBS/MJS pre-baked + genericRoadPlan + offline road search — the 8 AM road demo cannot die either
- Adding RAIL/WATER later = 1 registry entry + stops + optional prompt (recipe in docs/features/07)

---
Task ID: 4
Agent: Z.ai Code (main)
Task: Hackathon scope expanded to travel-in-general — design the WINGS ⇄ WHEELS transformation (plan only, build on "go")

Work Log:
- Read current v2 state: mode switch + ROAD mode already existed but only as label swaps (same amber skin, same boarding pass, bus-stand stops only, no train)
- Captured user's new direction: full highway-sign UI for road mode, old bus ticket artifact replaces boarding pass, stamps kept, AIR/ROAD renamed WINGS/WHEELS, WHEELS = bus + train
- Wrote complete build plan to PLAN-WHEELS.md: rename map, highway-sign design spec (bitumen bg, sign-green panels, hazard yellow), old bus ticket anatomy (stub, punch-holes, fare joke, train variant), journey-model input (FROM/TO + BUS/TRAIN toggle), schema/API additions (vehicle, destination, journey-mode ROUTE CONTROL prompt, 3 bespoke demo journeys), transition choreography, 6-phase build order (~5h), verification checklist, risks, docs protocol

Stage Summary:
- PLAN-WHEELS.md ready for user review — awaiting "go" before any implementation
- Key decisions: internal mode ids stay "air"/"road" (zero DB churn), stamps mechanic untouched, ticket = new self-contained component, vehicle field optional for back-compat
---
Task ID: 5-a
Agent: frontend-styling-expert
Task: Build the old bus ticket component (WHEELS mode artifact)

Work Log:
- Read worklog.md (last 80+ lines: Task 4 WHEELS pivot + 4-a component layer context), plan-schema.ts (Plan, VEHICLE_META, CATEGORY_META, fmtDuration, missionOffsets, VehicleId), stamp-badge.tsx (StampBadge props contract), boarding-pass-card.tsx (air twin: hash trick, perforation/notch mechanics, a11y patterns), mission-timeline.tsx (fmtClock pattern), globals.css (ticket-enter, perforation-v/h, notch, barcode, qr-blocks, punch-pop, blink-slow)
- CREATED src/components/terminal/bus-ticket-card.tsx — the only source file written this task
- Export/props contract: named export BusTicketCard, "use client", no default export; { plan: Plan; done: Record<number, boolean>; onToggleMission: (index: number) => void; source?: string } — drop-in twin of BoardingPassCard's core props
- Derived: vehicle = plan.vehicle ?? "bus"; origin = plan.airport.city; dest = plan.destination?.city ?? "& BACK"; band = VEHICLE_META[vehicle].ticketBand; fare = plan.fareJoke ?? VEHICLE_META[vehicle].fare; vehicleLabel "BUS · CLASSIC" / "TRAIN · EXPRESS"; ticketId TK-XXXX + 6-digit zero-padded serial via the pass's (h<<5)-h char hash (useMemo, SSR-safe, serial = Math.abs(h) % 1000000 padStart 6); offsets = missionOffsets(plan); local fmtClock → T+HH:MM; allDone guarded like the pass
- Anatomy built to spec: mobile stub strip / lg vertical ADMIT ONE column ([writing-mode:vertical-rl] rotate-180, punched dashed hole, TK NO. + ticket id); perforation divider copied 1:1 from the pass (notches + perforation-v on lg, perforation-h on mobile); red band inside body with TRAINING MODE badge when source === "demo"; route row with Bus/TrainFront ink circle + dashed lanes + ArrowRight, dest in #B3331F; ROUTE chip (bg-[#B3331F]/10) + Sora adventureTitle; 4-cell meta grid (DATE "NIGHT SERVICE · 10-11 OCT" / VEHICLE / WINDOW / FARE truncate+title); JOURNEY STAGES — TAP TO PUNCH with blink-slow ACTIVE ⇄ teal MISSION CLEAR pill; punch buttons (rounded-full border-2, aria-pressed, min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 touch targets, done = punched hole bg-background + Check in punch-pop, line-through title, MapPin location + Lightbulb tip); funFact fine print; barcode + TK/serial column; "IF LOST, THE ADVENTURE IS STILL YOURS" / "CONDUCTOR: ____________"; right panel lg:w-[248px] with TRAVEL STAMPS + "YOUR TICKET IS YOUR PASSPORT", StampBadge per mission (size 64, earned/animate from done), ✦ PERFECT RUN in #2d7d74, FARE PAID IN CHAI + qr-blocks
- Palette lock respected: cream #F4EFE4 / ink #17150F / red #B3331F + teal #2d7d74 (perfect-run/pill only) + CATEGORY_META inks; zero blue/indigo anywhere; only the sanctioned globals.css classes used, everything else inline Tailwind; lucide-only icons (ArrowRight, Bus, Check, Lightbulb, MapPin, TrainFront — TrainFront confirmed present in lucide-react 0.525.0)
- Deviations (deliberate, small): (1) pass's faint print-texture overlay added inside the body for paper realism (same inline gradient as the air twin); (2) meta-grid values unified at text-[10px] (spec pinned FARE only; text-sm values would overflow sm:grid-cols-4 cells); (3) origin/dest get break-words + leading-tight for long destination city strings; (4) band <p> gets min-w-0 so the 40-char "LAYOVER STATE ROADWAYS · WHEELS DIVISION" wraps instead of clipping on 390px phones; (5) the mobile stub|body perforation-h is rendered at the body's top edge (mirrors the pass's painting order so the tear dots render fully on both sides); (6) punch Check strokeWidth 2.5 for ink weight
- Per protocol: dev server and lint NOT run; read-only type check (tsc --noEmit) performed to protect the deliverable

Stage Summary:
- WHEELS artifact complete: src/components/terminal/bus-ticket-card.tsx (strict TS, zero any, named export, fully responsive: lg = 136px stub + body + 248px stamps panel; mobile = strip → body → stamps)
- Wire map for main agent: import { BusTicketCard } from "@/components/terminal/bus-ticket-card"; render INSTEAD of BoardingPassCard when plan.mode === "road" with the exact same props (plan, done, onToggleMission, source) — no extra props, nothing else to change
- Behavior parity with the air twin: same deterministic id scheme (TK- prefix + serial), same done/onToggleMission flow, StampBadge slam per mission, demo plans show TRAINING MODE in the red band, perfect-run state surfaces in both the ACTIVE pill and the stamp panel

---
Task ID: 5
Agent: Z.ai Code (main)
Task: Build the complete WINGS ⇄ WHEELS site per PLAN-WHEELS.md (user said "go")

Work Log:
- Phase A1: planSchema +vehicle/destination/routeCode/fareJoke (all optional); modes.ts full WINGS/WHEELS rebrand (labels, hero "WHICH ROAD NEXT?", sublines, planner/button/duration/footer copy); airports.ts +StopKind +8 railway stations (CLT ERS TVC SBC MAS CSMT HWH SC) + vehicle-aware search with excludeIata
- Task 5-a (frontend-styling-expert subagent): built src/components/terminal/bus-ticket-card.tsx — vintage bus ticket (ADMIT ONE stub, red band, punch-hole stages, stamp panel, train variant), worklog appended, tsc clean
- Phase A2/B: WHEELS_DEMO_JOURNEYS (KBS>MJS bus, CLT>TVC train, BOM>PNQ) + ROUTE_FLAVOR + genericWheelsPlan; prisma Trip +vehicle/destination/routeCode + db:push; plan API journey-mode ROUTE CONTROL prompt + pair-keyed demo lookup + hard-corrections; postcard train/bus scenes; trips API persists wheels fields
- Phase C: globals.css [data-mode="road"] token overrides + sign-panel/hazard-stripes/road-lane/board-glow-road/punch-pop/ticket-enter/pass-exit/theme-fade utilities
- Phase D: page.tsx full integration — data-mode root, journey form (BUS·ROADS / TRAIN·RAILS toggle, FROM/TO comboboxes), pass⇄ticket swap, highway advisory board in sign frame, wheels ticker/footer, wall chips (WINGS / WHEELS·BUS / WHEELS·TRAIN + "X → Y"), conductor announcement branch; combobox icon/vehicle/exclude props; slider label prop
- Phase E/F: fixed lowercase <vehicleIcon/> React casing bug (dev overlay "2 Issues" → 0); fixed ticket route row city-crush (switched to big stop codes + city captions); ticket max-w-4xl + planner section max-w-5xl while ticket shows (body width 275→630px); Tailwind JIT cache miss on lg:w-[210px] (touch globals.css rescan); restarted dev server for fresh Prisma client
- Verification: lint clean; curl — wheels bus/train demos instant, wings DXB regression, station search floats trains, generic fallback NH-∞, trips archive persists vehicle/destination/routeCode, wall returns chips; live AI journey Kochi→Mysuru "Spice Route Serenity" NH-766 GHAT 5 stages source:ai
- agent-browser golden paths: WINGS render → flip WHEELS (theme flip) → demo KBS→Bengaluru bus → ticket (KBS→MJS, NH-766 chip, punch stage 1 → aria-pressed + MOVE stamp earned + PATCH 200) → wall chips → NEW → wings DXB pass (BED→DXB) → CLT→TVC train ticket (rail band, 3 CHAI + 1 VADA) → mobile 390px stub strip + 44px targets; screenshots in shots/01–16

Stage Summary:
- LAYOVER v3 "Two Worlds, One Terminal" is LIVE: WINGS amber terminal + WHEELS highway-sign world with the old bus ticket; stamps mechanic byte-identical across both; demo chain covers both worlds; docs/features/07-wings-wheels-highway-mode.md written
- Key bugs found+fixed during verification: React casing, ticket route-crush, stale Prisma client, Tailwind arbitrary-class JIT miss

---
Task ID: 6
Agent: Z.ai Code (main)
Task: "Airport-related UI must be COMPLETELY changed in the wheels section" — audit + eliminate every airport remnant from WHEELS mode

Work Log:
- Audited page.tsx + all 10 terminal components + libs for airport language/amber styling visible in road mode; found 6 leaks
- globals.css GLOW ENGINE: added `[data-mode="road"] .board-glow` (green sign glow override) + semantic `.glow-amber` / `.glow-strong` classes with road-mode overrides (hazard yellow + green halo) — one CSS block re-tints every glow in the UI
- Replaced all hardcoded amber arbitrary shadows: page header logo tile, mode-switch active pill, vibe-picker selected chip, plan CTA button → now use semantic classes
- page.tsx copy: hero eyebrow mode-aware (GATE ∞ → MILE ∞), header tagline mode-aware (DEAD HOURS → DEAD MILES)
- duration-slider: `accent-[#f5a623]` → `accent-primary` (tracks --primary, flips to hazard yellow)
- airport-combobox: empty state mode-aware (TRY A MAJOR HUB → TRY A MAJOR JUNCTION OR STATION)
- vibe-picker: +mode prop + ROAD_HINTS map (foodie "eat the terminal" → "eat every dhaba dry")
- Bonus: fixed mobile hero flap clipping ("ICH ROAD NEX") — cell size 8.5vw → 5.6vw on mobile; both hero texts now fit 390px
- Verified: lint clean; agent-browser full pass — wings render → wheels flip (header bus tile, DEAD MILES, MILE ∞, WHICH ROAD NEXT?, hazard slider, green-glow duration, glow CTA) → demo KBS→MJS bus ticket → punch stage 1 → stamp earned (1) → flip wings (amber regression clean, GATE ∞ back) → train ERS→TVC ticket (3 CHAI + 1 VADA, rail band) → mobile 390px both worlds → wings DXB pass regression → zero console errors, all API 200
- Docs: docs/features/08-wings-wheels-highway-mode.md + v3.1 section (leak table + glow-engine rule)

Stage Summary:
- WHEELS is now 100% airport-free: no gate/terminal/hub words, no amber glows — bitumen + hazard yellow + sign green everywhere
- Glow engine pattern established: shared components use semantic glow classes; [data-mode="road"] overrides keep both worlds in sync from one CSS block
- Wings regression byte-identical; screenshots shots/20–33

---
Task ID: 7
Agent: Z.ai Code (main)
Task: Review + verify the postcard functionality end-to-end (both worlds), add SAVE POSTCARD download

Work Log:
- Read api/ai/postcard/route.ts + page.tsx postcard UI: 3 scene branches (air / bus ghat road / train backwater bridge), 100s timeout race, graceful ok:true source:none fallback, route-aware caption in road mode
- curl-verified all 3 API branches: air DXB 126KB, bus Kozhikode 241KB, train Ernakulam 236KB — all source:ai; visually inspected bus + train images (KSRTC-style bus on hairpin with tea stall; train on backwater bridge at dusk; no unwanted text/watermarks)
- Browser golden path: wheels demo KBS→MJS → POSTCARD → spinner ("THE PRESS IS INKING…") → image arrives ~27s → tilted cream postcard under ticket with caption "GREETINGS FROM THE NH-766 · VIA WAYANAD GHAT — WISH YOU WERE ON BOARD"; wings NEW → DXB → POSTCARD → "GREETINGS FROM DUBAI — WISH YOU WERE HERE"
- Fixed test-side flake: POSTCARD click must wait for the smooth-scroll to settle (scrollIntoView block:center before clicking) — sticky header was swallowing the click, not an app bug
- Enhancement: +SAVE POSTCARD download anchor on the postcard paper (data-url download, filename layover-postcard-<dest|code>.png, 44px touch target on mobile, Download icon) — judges can take the postcard home
- Verified: lint clean; SAVE anchor renders + downloads with zero console errors; 6× POST /api/ai/postcard 200 in dev.log

Stage Summary:
- Postcard functionality confirmed fully working in both worlds (API + UI + fallback path); images are demo-grade vintage travel posters
- New: SAVE POSTCARD download button on the rendered postcard
- Test pattern noted: scroll element to viewport center before clicking — page uses smooth-scroll + sticky header

---
Task ID: 7
Agent: Z.ai (main)
Task: "checkout the postcard functionality" — user hit THE PRESS IS INKING… → PRESS JAMMED — POSTCARD PENDING. Diagnose, fix, verify both worlds.

Work Log:
- Located postcard code: UI block + makePostcard() in src/app/page.tsx, API at src/app/api/ai/postcard/route.ts
- Forensics on dev.log: 6 postcard POSTs, ALL returned 200 (25–61s), ZERO [ai/postcard] catch-line logs ([ai/plan] fallback lines DO land in the log → stderr capture proven). Route never failed server-side.
- Direct curl to localhost:3000 succeeded every time (41s, source:"ai") → the severing is a ~30s proxy timeout in the preview chain between browser and Next, not the SDK
- Rebuilt API as async job queue: POST returns {ok,id} in <100ms, background runPress() with 110s deadline + 1 retry, GET ?id= polls, 15min in-memory TTL
- Rebuilt client makePostcard as poll loop (2.5s interval, 150s window, 4-error tolerance)
- UX: jam state now has RUN THE PRESS AGAIN button; loading state gained "INK DRIES IN ~1 MIN — HANG TIGHT"
- WHEELS semantic fix: road postcards illustrate plan.destination.city (where the bus is headed), not the origin stop; alt text follows
- Prompt upgrade: per-vibe foreground flavor line (foodie → street-food stalls + chai, weird → odd roadside landmark, etc.)
- Verified: instant POST (0.066s), 5–19ms polls, WINGS DXB postcard rendered in browser (shots/35), WHEELS KBS→MJS postcard rendered after a 72s slow press that would previously have been severed (shots/36) — caption GREETINGS FROM THE NH-766 · VIA WAYANAD GHAT — WISH YOU WERE ON BOARD
- Docs: created docs/features/09-postcard-press.md (full root-cause + design)

Stage Summary:
- Postcard press is now proxy-proof: no HTTP request lives longer than ~100ms, so no gateway timeout can ever jam it again
- Root cause documented for posterity: server always succeeded; preview-chain proxy severed >30s responses (client-side network error → jam state)
- Slow presses (up to ~90s) now survive; retry button removes the dead end
- New file: docs/features/09-postcard-press.md; modified: src/app/api/ai/postcard/route.ts (async rebuild), src/app/page.tsx (poll client + jam retry + destination-city postcards)

---
Task ID: 8
Agent: Z.ai (main)
Task: "the wheels section should feel like a complete different site focused on road trips and train journeys. don't bring airport inspired designs to that section and also the transition should be so smooth from the wings to wheels and vice versa"

Work Log:
- Full airport-DNA audit of page.tsx + terminal components in road mode (hero, board, planner, wall, chrome, tab title)
- Hero: road mode wraps split-flap in sign-panel gantry (green + white inset border); [data-mode="road"] .flap-cell re-skinned cream-on-green (globals.css)
- Advisory board: added board-shell class to DepartureBoard root; road mode flattens dark shell so board = ONE continuous green sign
- Copy: plannerHeading "FILE YOUR JOURNEY PLAN" → "PLOT YOUR ROUTE"; wall → "MILESTONE WALL / logged mile by mile"; emptyWallLine → "NO MILESTONES YET — FLAG OFF THE FIRST JOURNEY"
- Chrome: hazard-stripe strips on header::after + footer::before (road only, footer got `relative` for correct anchor)
- Tab title flips with world (useEffect on mode)
- World-swap choreography: sweep state in page.tsx; 650ms hazard slab L→R into wheels / amber beam R→L into wings; center division pill (ENTERING WHEELS DIVISION / CLEARED BACK TO WINGS); .mode-morphing class crossfades EVERY color 0.55s page-wide, removed after 780ms
- ModeSwitch rebuilt: single sliding thumb (grid-cols-2 + absolute pill, 300ms cubic-bezier transform), token-driven so it re-tints per world
- prefers-reduced-motion disables sweep/label/morph
- Verified via agent-browser: sweep mid-flight shots/41+45, settled worlds shots/42-44+46, KBS→MJS demo journey + punch→stamp regression in new world shots/47, mobile 390px shots/48, title flips, lint clean, dev.log zero errors

Stage Summary:
- WHEELS is now structurally its own site: highway gantry hero, continuous green advisory sign, PLOT YOUR ROUTE, MILESTONE WALL, hazard-striped chrome — split-flap retained deliberately (station heritage), fully re-tiled green
- World-swap is a choreographed ~0.8s moment: sweep + division pill + page-wide crossfade + sliding switch thumb
- Files: globals.css (v4 engine), page.tsx (sweep/gantry/wall/title), mode-switch.tsx (rewrite), departure-board.tsx (board-shell), modes.ts (copy), docs/features/08 v4 section appended
---
Task ID: 9
Agent: Z.ai Code (main)
Task: Redesign HIGHWAY ADVISORY as a red LED highway variable-message sign; replace the mode transition with a wheel roll (wings→wheels) and a plane flythrough (wheels→wings), keeping it smooth

Work Log:
- Read worklog, page.tsx, departure-board.tsx, mode-switch.tsx, globals.css sweep section to map the existing advisory + world-swap machinery
- New src/components/terminal/led-advisory.tsx — red LED dot-matrix VMS: metal cabinet bezel + corner bolts, black LED face with unlit pixel grid (::before) + glass sheen/vignette (::after), 6 cycling advisories (4.4s) that "relight" like real LEDs, blinking LIVE lamp, marching ❯❯❯ chevrons, EXIT ∞ strip, subtle panel flicker, role="img" aria-label
- New src/components/terminal/world-transition.tsx — overlay with two choreographies: to-road = spoked wheel (conic-gradient tread/rim/hub, nested roll + 1080° spin layers, ground shadow) unrolling an asphalt wipe (grit + hazard edges + dashed centerline); to-air = amber Plane glyph (38° climb attitude) + fading contrail painting an amber night-sky wipe (stars + leading beam); world-tag pill rides bottom-center
- page.tsx: conditional hero board (DepartureBoard in air, LedAdvisory in road), deleted WHEELS_BOARD_ROWS + old sweep JSX; switchMode rebuilt — data-mode now flips MID-TRANSITION via FLIP_MS=420 timer (vehicle crosses mid-screen → section changes), SWEEP_MS=1250 unmounts overlay, atomic-guard `if (m === mode || sweep) return`, flip/sweep timers in refs with unmount cleanup
- globals.css: removed dead `[data-mode="road"] .flap-cell/.flap-face/.board-shell` (road never mounts a flap); added LED section (.led-frame/.led-surface/.led-text/.led-dim/.led-dot/.led-blink/.led-relight/.led-march/.led-flicker) and WORLD-SWAP v2 (.world-wipe-road/.world-wipe-air/.road-centerline/.world-wheel/.wheel-*/.world-plane/.plane-glyph/.plane-contrail/.world-tag-*); wipe fades out over final 20% so unmount never pops; reduced-motion covers all new classes
- HIT A STALE-CSS BUG: heavy globals.css rewrite while next dev ran left the served CSS chunk frozen (browser had old mode-sweep CSS, new JSX unstyled; CSSOM grep proved led-*/world-* MISSING). touch didn't help. Fixed by killing dev server, rm -rf .next, restarting detached via `(setsid bun run dev &)` (plain nohup/setsid got reaped between tool calls — double-fork subshell pattern survived)
- agent-browser verified: air hero intact (37); wheel roll mid-flight frames with asphalt+centerline+wheel at leading edge (40, 41); settled LED world — red CAUTION/ADVENTURE AHEAD, LIVE, chevrons, bolts (42); plane flythrough early frame — amber glyph + contrail over still-visible road world (46), sky painted (44), WINGS restored (45); mobile 390px both worlds + LED fit (47-50); double-click during transition ignored; data-mode settles road→air; title flips; demo KBS→MJS ticket + stage punch + MOVE stamp regression (51-53); zero page errors/console noise
- bun run lint clean; dev.log clean; doc 08 v4.1 section written (incl. stale-CSS ops note); shots 37-53

Stage Summary:
- WHEELS hero is now a genuine red LED highway gantry sign — zero airport/solari DNA in road mode; the two worlds run different machines (mechanical flaps vs electronics)
- Mode swap is now cinematic and diegetic: a wheel rolls the new road world in; a plane flies the amber sky back in; the section flips mid-flight under the vehicle; colors crossfade underneath; overlay is aria-hidden + pointer-events-none with reduced-motion fallbacks
- Files: src/components/terminal/led-advisory.tsx (new), src/components/terminal/world-transition.tsx (new), src/app/page.tsx, src/app/globals.css, docs/features/08-wings-wheels-highway-mode.md (v4.1)
- Ops lesson recorded: heavy globals.css edits can freeze the dev CSS chunk → restart dev server with rm -rf .next and detached double-fork start

---
Task ID: 10
Agent: Z.ai (main)
Task: Counter the organizers' cost-of-execution concern with a real cost-effective solution; rework the wheels→wings transition so the plane flies right-to-left and its size completely fills the screen.

Work Log:
- Plane rework: .world-wipe-air now transform-origin:right (amber sky unrolls from the right, leading beam moved to the panel's left edge); plane-fly keyframes rewritten R→L with climb (60vh→40vh); --plane sized clamp(480px, 150vmax, 2200px) so the airframe is ~1.5× the viewport and the plane itself fills the screen
- First attempt used a solid-filled lucide Plane glyph at that zoom — browser frames showed it read as abstract yellow geometry; replaced with purpose-drawn JetSilhouette side-view airliner SVG (tailfin, tailplane, fuselage, cockpit glass, 14-window line, doors, swept wing, twin engine pods with dark intakes), rotate(-6deg) climb attitude, twin contrails re-anchored at engine exhausts trailing east, cheap static .plane-glow radial instead of animated drop-shadow filter
- Cost guard engine (src/lib/cost-guard.ts): 3-tier ladder — SHOWCASE (local fixtures, ₹0) / CACHED (24h plans+postcards, 1h TTS clips) / LIVE (SDK call) — with hard rolling-hour budget AI_HOURLY_BUDGET (default 60), AI_SHOWCASE=1 zero-spend kill-switch, costSnapshot() readout
- Plan route: 24h cache TTL (was 10min), cache-hit + showcase counters, budget gate → demo locker fallback (source:"showcase") instead of LLM
- Postcard route: 24h GALLERY cache keyed by scene (repeat press = instant free replay, job.source "cache"), budget/showcase gate → locally drawn SVG postcard (source:"showcase", new src/lib/postcard-svg.ts, 3 mode-aware vintage scenes: bus on ghat hairpins / train on backwater bridge / jet past control tower), live presses counted + stored to gallery
- Announce route: 1h clip cache by text (replays are free byte-streams), budget gate → 429 graceful silence
- New GET /api/cost endpoint; new footer CostGuardChip (LIVE n/60 · SAVED n, tier dot green/amber/red, 12s poll, sr-only + title tooltip); ZERO-SPEND PRESS ticket badge for showcase-source plans, TRAINING wall chips extended to showcase, COST GUARD engaged toast; makePostcard instant path skips the 1.5s wait when POST already says status:"done"
- docs/cost-playbook.md written (3-tier ladder, per-feature cost math, knobs, demo-day 30-second Q&A script); docs/README.md index + doc 08 v4.2 section
- Verified: curl double-press — press1 live 27s / press2 instant cached:true, /api/cost LIVE 1/60 SAVED 1; AI_SHOWCASE=1 restart — plan source:showcase 0 spend, postcard 0.123s SVG source:showcase (all 3 scenes screenshotted: 62-64); browser golden path — demo DXB ticket → POSTCARD live press (~40s, rendered) → re-press gallery replay rendered in <2s (dev.log "gallery replay (0 calls spent)"), footer chip counts up; desktop video frames 58-60 (nose enters right → full airframe fills screen → wings restored) + mobile 390px frame 67; wheel roll regression 55-57; lint clean; zero console errors

Stage Summary:
- Cost question now has an architectural answer, not a promise: hard hourly ceiling + 24h caches + ₹0 showcase mode, all visible live in the footer (COST GUARD · LIVE n/60 · SAVED n) and pitchable via docs/cost-playbook.md
- 50 judges mashing the demo postcard = exactly ONE image generation per day; AI_SHOWCASE=1 runs the entire night at ₹0 with postcards still printing (locally drawn SVG)
- WHEELS→WINGS is now a full-screen westbound jet: enters right, airframe covers the viewport, amber sky + twin contrails paint in behind, wings world settles ~1s later
- Files: src/lib/cost-guard.ts (new), src/lib/postcard-svg.ts (new), src/app/api/cost/route.ts (new), src/components/terminal/cost-guard-chip.tsx (new), world-transition.tsx (JetSilhouette), globals.css (plane/wipe rework), plan/postcard/announce routes (tier gates + caches), page.tsx (chip + toast + instant press), bus-ticket-card.tsx (ZERO-SPEND PRESS badge), docs/cost-playbook.md (new), docs/README.md, docs/features/08 (v4.2)
- Ops: restarts used the (setsid nohup … &) double-fork pattern; HMR handled the JetSilhouette CSS swap without a stale chunk this time
---
Task ID: 11
Agent: Z.ai Code (main)
Task: Add a light and dark theme toggle

Work Log:
- Audited setup: next-themes ^0.4.6 already in package.json (unused), `@custom-variant dark` already in globals.css, `data-mode` lives on the page-root div → day palettes must be `html.light` / `html.light [data-mode="road"]` (theme on <html>, mode on div — double selector required)
- New src/components/theme-provider.tsx: next-themes wrapper, attribute="class", defaultTheme="dark", enableSystem={false} (deterministic first paint for demo day), disableTransitionOnChange; wrapped children+Toaster in layout.tsx (html already suppressHydrationWarning)
- New src/components/terminal/theme-toggle.tsx: header Sun/Moon button, stacked icons crossfade rotate+scale (fixed size), aria-pressed + descriptive aria-label ("Switch to DAY/NIGHT TERMINAL…"), token-driven (re-tints per world); hydration probe via useSyncExternalStore(emptySubscribe, ()=>true, ()=>false) instead of setState-in-effect — first lint run failed react-hooks/set-state-in-effect, rewritten lint-clean; pre-hydration assumes night so SSR markup = first client markup
- globals.css DAY ⇄ NIGHT engine appended before reduced-motion block: `color-scheme` dark on :root / light on html.light; html.light = WINGS day (ivory #f5f0e4, deep amber #a86a08, ink #221c10, dark solari kept); html.light [data-mode="road"] = WHEELS day (concrete #edebdd, dark hazard gold #96740a, sign-green accents); daylight body gradients + selection + scrollbar; neon glows (.board-glow/.glow-amber/.glow-strong + road variants) swapped to print-style relief shadows in day (specificity ladder documented: :root < html.light < [data-mode="road"] < html.light [data-mode="road"]); html.light .road-lane dashes flip dark
- Design doctrine: MACHINES STAY HONEST — solari flap cells, red LED cabinet, green sign panels, paper tickets keep physical colors in both themes; only ambient light changes (real departure boards are dark indoors, VMS signs are black in daylight)
- page.tsx: <ThemeToggle /> in header between DEMO MODE switch and PLAN MINE
- Verified via agent-browser: default html.dark (shot 70); toggle → html.light, body rgb(245,240,228) (71); road-day --primary #96740a on div (72), planner/wall day (73); reload persistence → still light; night restore → amber #f5a623 air / #f5c518 road (74-75, road-night pixel-identical); mobile 390 road-day (76); full golden path in air-day: demo DXB → boarding pass renders on ivory, wall + footer CostGuardChip fine (77); zero browser console/page errors, zero dev.log errors; bun run lint clean
- Docs: docs/features/10-theme-toggle.md (template-complete), docs/README.md index row 10, README Design row

Stage Summary:
- Four full palettes from one toggle: air-night (brand, untouched :root), air-day, road-night (untouched [data-mode="road"]), road-day — all pure CSS custom properties, zero dark: utilities in components, zero component re-skins needed
- Theme is orthogonal to the WINGS⇄WHEELS world swap (theme on <html> class, mode on div attribute) and persists across reloads
- Demo-day angle: daylight mode is the projector-safety valve if the hall screen washes out amber-on-black
- Files: src/components/theme-provider.tsx (new), src/components/terminal/theme-toggle.tsx (new), src/app/layout.tsx, src/app/globals.css, src/app/page.tsx, docs/features/10-theme-toggle.md (new), docs/README.md, README.md; shots 70-77
---
Task ID: 12
Agent: Z.ai Code (main)
Task: Fix light-mode sections that were mismatching / invisible (user report after Task 11)

Work Log:
- Full census of hardcoded colors (rg across page.tsx + terminal components): confirmed all #f4efe4/#0c6d38 hits are road-conditional or on-paper — the real bug was token-contextual, not hardcoded
- Browser walkthrough (shots 78+) exposed it: inside the road-mode green sign-panel, controls use ambient tokens (text-muted-foreground, border-border, presets, vibe chips, slider label) — in DAY mode html.light re-points those tokens to dark-concrete values → dark text/borders on mid-green = invisible. Night worked only because :root muted grays happened to read on green
- Fix 1 (engine-level): new ON-SIGN TOKEN SCOPE in globals.css — .sign-panel/.sign-panel-sm define their own contrast system (cream foreground/muted/borders/input/popover #0e5c30 dropdowns, recessed --background #0b5a2f, hazard --primary #f5c518 + ink foreground). Custom properties resolve from the NEAREST defining ancestor, so the block wins over both :root and html.light for everything inside the sign, in BOTH themes; day-night symmetric by construction
- Fix 2 (CSS inheritance gotcha): shadcn outline/ghost buttons inherited `color` as a COMPUTED value from body (resolved outside the sign → day ink #221c10 on dark green). Added `color: var(--foreground)` to the on-sign block so inheritance re-roots at the panel
- Fix 3: wall progress dots bg-border → bg-muted-foreground/40 (bg-border was invisible in day)
- HIT STALE-CSS TWICE (same as Task 9): served chunk kept old rules after globals.css edits; first fix attempt looked like a no-op in browser (shots 79 identical to 78) until curl-proved 0 hits in served CSS. Applied ops lesson: pkill next dev + rm -rf .next + (setsid nohup bun run dev &) — after restart the block served correctly (chunk name is stable; grep for it, don't trust the name)
- Verified: road-day form fully legible (80), KBS→MJS journey end-to-end in day — ticket, stages, punch (89), ANNOUNCE/POSTCARD/NEW cream on green (87, computed color rgb(244,239,228)), road-night regression (90) unchanged/better (buttons cream instead of gray, --primary now consistently hazard on-sign), stamp slam at night ✓; air-day unaffected (no sign-panel in air); zero console/page errors, lint clean
- Note: one flag-off false alarm ("journey incomplete" toast) traced to automation ref-drift with overlapping dropdowns, not a product bug — natural click order works

Stage Summary:
- Rule of thumb recorded: ANY colored surface that hosts token-driven controls must define its own token scope (like the sign) — ambient page palettes can flip under it when day/night lands
- Road-day is now fully usable: form, dropdowns, presets, chips, slider, actions, ticket, stamps
- Files: src/app/globals.css (on-sign token scope + color re-root), src/app/page.tsx (wall dots), shots 78-90

---
Task ID: 13
Agent: Z.ai Code (main)
Task: "remarks in flight section is still not visible light mode" — fix the split-flap solari (departure board) in WINGS for the DAY theme.

Work Log:
- Traced the report to `DepartureBoard` (src/components/terminal/departure-board.tsx): the solari shell is a fixed-dark machine (`bg-[#0e0f12]`, honest in both themes) but its REMARKS header used `text-muted-foreground/70`, REMARKS column used `text-foreground/70`, and STATUS lamps used `text-primary` — all theme-reactive, so `html.light` re-pointed them to dark ink/bronze → invisible on the near-black board
- Applied the established ON-SIGN pattern as a new ON-BOARD TOKEN SCOPE in globals.css: `.board-shell { color: var(--foreground); --foreground:#f2eee3; --muted-foreground:#94907f; --primary:#f5a623 }` + `[data-mode="road"] .board-shell { --primary:#f5c518 }` — direct definitions beat every inherited ambient value in both themes
- Added lamp-glow exception: `html.light .board-shell .board-glow` (+ road variant) restores the night neon text-shadow inside the machine, overriding the daylight relief-shadow rule at higher specificity
- HIT STALE-CSS AGAIN (3rd time): first verification showed rules missing from served CSS even though file was correct — curl + python grep of the raw served chunk proved the `.board-shell` scope rules absent while sibling glow rules (same MultiEdit) were present (watcher race on intermediate write). Remedy this round: a real content change (temp marker comment) + reload flipped the chunk; marker removed after; re-verified tokens persist post-rebuild
- audited the rest of the flight section for the same class of bug: only the solari consumes ambient tokens inside a fixed machine — LED advisory uses dedicated `led-*` classes, ticket uses paper/ink vars, everything else sits on the page background where flipping is intended
- Four-quadrant browser verification (agent-browser, computed values + screenshots): air-day REMARKS fully readable (79), road-day LED cabinet crisp (80-81), air-night (82) + road-night (83) zero regression; `--primary` on air-night board still `#f5a623`, dark theme class intact after reload
- lint clean, dev.log clean; updated docs/features/10-theme-toggle.md (new troubleshooting row + lighter stale-CSS remedy + exact-filename shot refs)

Stage Summary:
- Rule of thumb (2nd instance): any fixed-color "machine" surface that hosts token-driven text must define its own token scope — `.board-shell` joins `.sign-panel` in the machine-scope family in globals.css
- Root cause class: ambient tokens (`text-foreground`/`text-muted-foreground`/`text-primary`) are safe ONLY on surfaces that flip with the theme; the solari and LED stay physical, so their text must be pinned
- Ops lesson: stale Turbopack CSS chunk can serve a MIX of old+new rules from one edit — verify with curl+grep of the served chunk, flip with a real content change before resorting to a dev-server restart
- Files: src/app/globals.css (on-board token scope + lamp-glow exceptions), docs/features/10-theme-toggle.md, shots 78-83

---
Task ID: 14
Agent: Z.ai Code (main, self-audited per user instruction)
Task: Build the "EVERY BODY BOARDS" USP — IATA SSR access profiles (WCHR / DPNA / DEAF) planned end-to-end, then audit the complete workflow for zero errors.

Work Log:
- Wrote the contract first: plan-schema.ts gained ACCESS_PROFILES (real IATA codes with per-code prompt directives), optional mission access fields (distanceM / stepFree / sensory), plan.accessProfile, applyAccessProfile() deterministic normalizer (LLM output is never trusted with access promises — caps 400m WCHR / 600m DPNA, forces step-free/quiet), walkTotalM()
- Prisma: Trip.accessProfile + Mission.distanceM/stepFree/sensory; db:push clean
- /api/ai/plan: profile validated against the registry, injected as a system-prompt directive + user-prompt field note, cache key extended (:access), normalization applied to AI plans AND demo/showcase/offline fallbacks (demo mode shows the feature reliably for judges)
- /api/trips: persists + serves accessProfile; wall cards render an SSR badge
- New components: AccessPicker (radiogroup, 4 options), LedCaptionStrip (red LED caption feed — captions every TTS announcement for DEAF trips + LIVE MIC via feature-detected webkitSpeechRecognition, auto-restart on silence, fails quiet)
- MissionTimeline + BoardingPassCard + BusTicketCard: per-mission chips (STEP-FREE / ≈N M / QUIET / LOUD), ACCESS·SSR meta cell, stub "SSR <code>" print, honest per-profile roll line (DEAF prints VISUAL-FIRST instead of step-free claim)
- page.tsx: state + body wiring, caption strip under the ticket for DEAF trips, .low-stim root class (applies the moment DPNA is picked, persists through the trip), wall SSR badge
- globals.css: .low-stim kinetic mute (blink/flicker/march/ticker/flap-flip/punch/stamp stop; static glow stays — machines keep their light, lose their motion)
- Audit: fixed a react-hooks/set-state-in-effect lint error in the caption strip via useSyncExternalStore hydration probe (same pattern as theme toggle); fixed my own dropped try{ opener in playAnnouncement; fixed pre-existing announce route TS2345 (Buffer→Uint8Array for NextResponse) — src/ now has ZERO tsc errors; lint clean; dev.log clean; browser console clean after fresh load (the two "Parsing failed" console entries were historical from mid-edit, gone after reload)
- FOUGHT STALE CHUNKS 2x (4th/5th incidents): .low-stim rules and the trips-route accessProfile field were absent from served artifacts despite correct files. CSS flip: real content change + reload. API route refused to flip → escalated to the runbook heavy remedy (pkill next dev, rm -rf .next, clean restart) which cleared everything
- E2E verified in browser: WCHR air pass (SSR chip + TOTAL ROLL ≈ 930 M + STEP-FREE/≈M chips, shots 84), DEAF caption strip + announcement text on the LED feed, DPNA instant mute (computed animationName 'none' on badge+ticker, shots 85/92), wall SSR WCHR badge (shots 86-88), day-mode legibility (89-90), WHEELS road journey KBS→MJS with WCHR chips + SSR print (91), DB round-trip (trips API returns accessProfile 'wchr' for the fresh trip)

Stage Summary:
- USP live: "file a real IATA assistance code → the whole terminal plans around your body" — differentiator no same-idea team can match quickly (contract + prompts + artifacts + DB, not a UI skin)
- Design doctrine held: access features are printed artifacts and machine behavior (SSR codes on tickets, caption LED, still terminal), never a "settings page"
- Ops: stale Turbopack chunks now hit BOTH css and api routes — verify served bytes (curl+grep) before debugging code; content-change flip first, clean restart second
- Files: plan-schema.ts, schema.prisma, api/ai/plan, api/trips, api/ai/announce (type fix), access-picker.tsx, led-caption-strip.tsx, mission-timeline.tsx, boarding-pass-card.tsx, bus-ticket-card.tsx, page.tsx, globals.css, docs/features/11-access-profiles.md, docs/README.md, README.md, shots 84-92
---
Task ID: 15
Agent: Z.ai Code (main)
Task: ① Crew leaderboard with login (airport-level + overall, badges = stamps) · ② fix speech-to-text in the deaf section · ③ postcards must depict the actual airport/station/place (relatable fallback, never wrong-city blunders).

Work Log:
- Schema: Traveler.pinHash (sha256 of 4-digit crew PIN); db:push clean
- NEW /api/auth/login: POST claim/login (new callsign → PIN claims; unclaimed → PIN claims; mismatch → 401), GET ?id= session restore; PIN hashed "layover-crew:"+pin; response derives trips+badges from DB
- NEW /api/leaderboard: full read + in-memory rollup → overall (crew by badges, trips>0) + airports (badges+crew count per iata, mode/vehicle icons)
- /api/trips: POST accepts travelerId (logged-in crew wins over nickname upsert); GET now serves traveler nickname → wall cards print "· CREW <NAME>"
- NEW /api/ai/transcribe: base64 audio → zai.audio.asr.create → text; CostKind "transcribe" added to cost-guard (byKind + liveThisHour + roll reset)
- LedCaptionStrip rewritten: ENGINE A browser SpeechRecognition with full error mapping (not-allowed/network/unknown → hand to B; no-speech/aborted → keep listening); ENGINE B MediaRecorder 7s clips → /api/ai/transcribe (mime pick webm/mp4/ogg, silence guard, segment chaining); every fault prints ON the LED ("NO MICROPHONE FOUND…", "MIC BLOCKED BY THE BROWSER…", "PA SIGNAL UNCLEAR…"); aria-live on the caption line
- NEW src/lib/landmarks.ts: STOP_SCENES for every bundled airport + road stop; sceneForStop() falls back to city-anchored generic scenes that name NO landmark (generic safe, wrong-city not)
- Postcard route: buildPrompt uses sceneForStop + "must depict <city>… do not borrow other cities' landmarks" guard; gallery key now includes iata; svgPostcard gains iata param + "GREETINGS FROM <CITY>" ink plate stamp
- page.tsx makePostcard now sends iata (air → airport.iata, road → destination.code)
- NEW crew-login.tsx (CrewChip + CREW GATE dialog, InputOTP 4-digit PIN, self-refreshing badge count on refreshKey); NEW leaderboard.tsx (two .board-shell machine boards, RankMark ✦ top-3, YOU highlight, 25s poll, max-h-80 scroll)
- page.tsx: crew state + localStorage layover-crew session restore, boardTick refresh signal (login/save/stamp), BADGE EARNED toast with CATEGORY_META label, CREW LEADERBOARD section under the wall
- Fixed my own mobile regression (CrewChip pushed header past 390px → PLAN MINE clipped): WifiOff icon hidden on mobile, header gaps tightened, logo subtitle hidden sm:block, PLAN MINE px-3 on mobile — 378/390px verified
- VLM verification loop caught a REAL scene bug: my CCJ scene described Chinese fishing nets (iconic to KOCHI — the exact blunder class the user flagged). Corrected to Kozhikode banded lighthouse + stone pier + Beypore uru dhow; re-pressed + re-verified
- HIT STALE MODULE STATE (6th incident, new variant): new cost-guard code ran against a globalThis state created by the old module → s.live.transcribe undefined → canSpend false + NaN→null in /api/cost. Clean restart (pkill + rm .next + restart) fixed; lesson recorded in doc 12 troubleshooting
- Verified: lint clean; tsc src/ zero errors; ASR pipeline end-to-end (TTS wav → /api/ai/transcribe → accurate text back); auth edge cases via curl (wrong PIN 401, correct PIN ok, validation); browser E2E — login flow, badge toast, header 0✦→1✦, YOU row highlight, both boards live with real data (COK 14 / CCJ 13 / KBS 9…), wall callsigns, DEAF caption strip + honest mic fault + announcement captions, postcard gallery replay rendered Calicut scene, day-mode boards stay machine-dark, mobile 390 boards stack + header fits, road mode regression clean; dev.log + browser console zero errors; shots 93–98

Stage Summary:
- Gamification loop shipped: CREW GATE → trip → stamp → BADGE → both leaderboards move, with the judge's own row lamp-lit. ~40s from login to seeing your name climb.
- Badges ARE the passport stamps the product already minted — gamification earned by the artifact, not bolted on.
- Deaf section STT now works through two engines and never fails quiet: if the mic is blocked the board says exactly what's wrong and what still works (announcement captions).
- Postcards are anchored to the real place: per-stop landmark scenes + anti-borrow guard + stamped SVG fallback; VLM-audited (and the audit fixed a genuine Kochi-for-Calicut mistake in my own registry).
- Files: schema.prisma, api/auth/login (new), api/leaderboard (new), api/ai/transcribe (new), api/trips, api/ai/postcard, cost-guard, landmarks.ts (new), postcard-svg.ts, led-caption-strip.tsx, crew-login.tsx (new), leaderboard.tsx (new), page.tsx, docs/features/12 (new), docs 09 v5 + 11 v2, docs/README; shots 93–98
---
Task ID: 16
Agent: Z.ai Code (main)
Task: Leaderboard redesign per user clarification — "not a leaderboard FOR airports; PEOPLE categorized by airport/rail/bus + overall board is ok".

Work Log:
- Rewrote /api/leaderboard: response now { overall[], locations[] } — locations[] = per-stop boards, each with { code, city, mode, vehicle, badges, crewCount, crew: [{nickname, trips, badges}] } where crew[].badges = badges earned AT that stop (ranked people, stops never ranked); single full-read + in-memory rollup kept (hackathon scale)
- Rewrote leaderboard.tsx right panel: "STOP LEADERBOARD — PEOPLE BY BADGES" with a role=tablist chip row (one chip per stop: mode icon ✈/🚌/🚆 + code + badge count, horizontally scrollable on mobile); selecting a chip ranks that stop's people; meta line shows city + crew count + badges here; YOU highlight on both boards; selection sticky across 25s polls
- Added follow-the-crew behavior: on load + after every badge (refreshKey bump) the STOP board jumps to the stop where the logged-in crew holds the most badges (fresh login at a gate → board follows them there)
- page.tsx section copy updated ("Crew ranked by badges — overall, and at every gate they've played"); docs/features/12 + docs/README row rewritten to the people-per-stop semantics
- Verified E2E with agent-browser: API rollup correct (COK/CCJ/DXB air, KBS/VYT bus, ERS/CLT train with per-stop crew rankings); chip switching rewrites rows; logged-in CAPTAIN-CHAI auto-followed to CCJ then to DXB after stamping 2 demo missions (overall rank 02 · 3 badges; DXB board rank 01 · 2 HERE, YOU lamp-lit); shots 99-103 (light/dark/mobile, boards stack, footer sticky); zero console/page errors; lint clean

Stage Summary:
- Leaderboard now answers "who owns THIS gate tonight?" — people ranked per place they played (airport gate / railway station / bus stand) + overall crew champion; the judge's own row follows them around the hall
- Files: api/leaderboard/route.ts, components/terminal/leaderboard.tsx, page.tsx (copy), docs/features/12, docs/README.md; shots 99-103
---
Task ID: 17
Agent: Z.ai Code (main)
Task: Implement USP-A "THE BOARD DEFENDS YOUR TIME" — the last approved-but-unbuilt item (audit confirmed zero SCRUBBED/window/clock code existed).

Work Log:
- New src/lib/mission-clock.ts: single clock source (SIM_RATE=3 journey-min per real second, SCRUB_GRACE=10, FINAL_CALL=10), missionWindows/missionPhase/missionBoardStatus/fmtJourneyClock — zero Date.now() in the app
- plan-schema: Plan.windowAnchorMin (zod optional) + missionStarts() anchor-aware schedule (compresses missions into total−buffer−anchor; returns starts AND ends — also fixed the timeline's "ends T+" which used raw duration instead of scaled)
- page.tsx: clockMin interval gated on (step ready && plan && demoMode); phases derived per render; live mission rows M-01… prepended to the solari with status/tone per phase (ON TIME → BOARDING → FINAL CALL → SCRUBBED / DONE ✦) — the existing split-flap cells animate every flip for free; demo clock chip (role=timer); WINDOW CLOSED toast once per mission per plan (scrubbedSeenRef, reset on generate/replan/reset); REPLAN button (N SCRUBBED) next to NEW
- REPLAN: keeps done+in-window missions (index-remaps done[] AND missionIds[] to keep stamp PATCHes correct), appends fresh missions from the same-mode generic pool (rawUsed ≤ remainingPlay×1.5, total ≤ 6 zod cap, scrubbed titles allowed back for a second window), sets windowAnchorMin=clockMin
- mission-timeline + boarding-pass-card + bus-ticket-card: optional scrubbed prop → red WINDOW CLOSED · SCRUBBED chip, dimmed row, stamp/punch disabled (aria-disabled)
- TWO self-caught bugs during E2E: (1) v1 replan recomputed windows from T+00 → fresh missions born pre-scrubbed at clock T+02:54 → fixed via windowAnchorMin (honest replan-from-now semantics); (2) replan pool filtered against the whole plan's titles → demo plans (which come FROM the pool) always had an empty pool → now filters kept titles only
- TOOLING QUIRK discovered: literal "[m" sequences in COMMAND OUTPUT get swallowed in the tool-result pipeline (ANSI reset interpretation) — page.tsx was NEVER corrupted ("const [mode" displayed as "const ode"); confirmed via python byte check + tsc (src/ has zero errors; the 4 project tsc errors are pre-existing in examples/ + skills/)
- Verified E2E air (DXB demo): clock chip ticks T+00:00→03:45, board rows flip with flap animation, WINDOW CLOSED toast renders, pass chips + disabled stamps, REPLAN · 4 SCRUBBED → fresh missions anchored at clock (never pre-scrubbed), stamps still earn badges; road (KBS→MJS): conductor ticket shows WINDOW CLOSED chips, punches disabled — shots 104-107 (light+night)
- lint clean, tsc src/ zero, dev.log clean, browser console clean; docs/features/13 written, docs/README row 13 added

Stage Summary:
- USP-A live: "Our board defends your time" — the hero solari is now the product's antagonist/enforcer: ignore a mission and the board scrubs it in front of the judges, press REPLAN and the board re-files your ticket from NOW. Fully automatic inside the 2-minute demo (hands-off scrub in ~20-60s).
- Files: lib/mission-clock.ts (new), lib/plan-schema.ts, page.tsx, mission-timeline.tsx, boarding-pass-card.tsx, bus-ticket-card.tsx, docs/features/13 (new), docs/README.md; shots 104-107
