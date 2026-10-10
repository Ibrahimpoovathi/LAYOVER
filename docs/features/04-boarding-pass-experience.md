# 04. Boarding pass experience

> Status: ✅ · Last verified: 2026-10-10 · Owner: Z.ai Code (main) · documented by task 2-a

## TL;DR
The demo's money shot: an AI plan renders as a perforated paper boarding pass (BED→IATA route, meta chips, barcode stub, passport stamps). Completing a mission in the timeline slams an SVG rubber stamp onto the stub. `GenerationStatus` turns the ~10–20s AI wait into gate-control theatre.

## Why it exists (rubric tie)
- **Creativity (10):** "collectible boarding pass + passport stamps" is the memorable artifact judges photograph.
- **Demo (5):** mission toggle → stamp slam is the interactive 5-second moment handed to judges.
- **Built (20):** four components, deterministic pass IDs, DB-backed mission toggling — defensible depth.
- **Travel (10):** the artifact is literally a boarding pass; T+ mission times respect a security buffer.

## Files
| File | Responsibility |
|---|---|
| `src/components/terminal/boarding-pass-card.tsx` | paper pass layout: route, chips, perforation, stub, stamps row |
| `src/components/terminal/mission-timeline.tsx` | T+ mission list, category nodes, complete/undo buttons (light & terminal variants) |
| `src/components/terminal/stamp-badge.tsx` | SVG rubber stamp, textPath arc, slam/ghost states |
| `src/components/terminal/generation-status.tsx` | theatrical loading overlay, cycles `GATE_CONTROL_LINES` |
| `src/lib/plan-schema.ts` | `Plan`/`Mission` types, `CATEGORY_META`, `fmtDuration`, `missionOffsets` |
| `src/lib/demo-mode.ts` | `GATE_CONTROL_LINES` (6 strings), demo plans |
| `src/app/page.tsx` | owns `plan`, `done`, `source`, `missionIds` state; wires everything |

## How it works
**Data flow (page.tsx → pass → stamp):**
1. `generate()` POSTs `/api/ai/plan` with `{ iata, city, country, durationMin, vibe, forceDemo: demoMode }`. On success: `setPlan(data.plan)`, `setSource(data.source ?? "ai")`, `setStep("ready")`, `setDone({})`; `saveTrip()` archives and stores DB mission ids in `missionIds`. On total network failure it falls back to `genericDemoPlan(...)`.
2. Renders `<BoardingPassCard plan={plan} done={done} onToggleMission={toggleMission} source={source} />`.
3. `toggleMission(i)` flips `done[i]` and fire-and-forgets `PATCH /api/missions/${missionIds[i]}` with `{ done: next[i] }` (skipped when no DB id, e.g. offline fallback).
4. `done` fans out everywhere: timeline node fill + title `line-through`, `StampBadge earned={!!done[i]}` (slam on true), header chip `ACTIVE → MISSION CLEAR`, `✦ PERFECT RUN` line when all categories are stamped.

**BoardingPassCard internals:**
- `passId` = deterministic hash (djbXOR-style, `useMemo`) of `` `${plan.airport.iata}:${plan.adventureTitle}` `` → base36 4 chars → `LYO-XXXX` (padded with "X"). No `Math.random` → SSR-safe.
- Main section: `bg-paper text-ink` + print-texture overlay; header shows `passId · GATE CONTROL ISSUE`, a `TRAINING MODE` chip **iff `source === "demo"`**, and an `ACTIVE` (chip `bg-ink text-paper blink-slow`) / `MISSION CLEAR` (`bg-[#2d7d74]`) status chip.
- Route row: literal `BED` ("YOUR CURRENT SPOT") → dashed line + plane icon → `plan.airport.iata` in `#c2452d` over `city, country`.
- Meta chips (grid-cols-3): `WINDOW` = `fmtDuration(plan.totalDurationMin)`, `VIBE` = `plan.vibe`, `SEC. BUFFER` = `fmtDuration(plan.bufferMin)`.
- Missions section embeds `<MissionTimeline plan done onToggle={onToggleMission} light />` under `MISSION MANIFEST — N OBJECTIVES`.
- Perforation: vertical `.perforation-v` + 2 `.notch`s on lg (`hidden lg:block`, positioned `-left-[7px]`); horizontal `.perforation-h` on the stub top for mobile (`lg:hidden`, `-top-[7px]`); stub gets 2 more notches (`-right-3`).
- Stub (`lg:w-[248px]`): `adventureTitle` (Sora), `funFact` in quotes, stamps row — one `<StampBadge category={m.category ?? "chill"} earned={!!done[i]} index={i} size={66} animate={!!done[i]} />` per mission — then `.barcode` + `.qr-blocks` and `passId` / `GATE ∞ · SEQ {missions.length}0{bufferMin % 10}`.

**StampBadge internals:** unique SVG ids via `useId()` (`stamp-arc-${uid}`, colons stripped) so multiple stamps don't collide. Rotation picked from `ROTATIONS = [-9, -4, 6, 11, -13, 3]` by `index % 6`, passed as `--stamp-rot` (drives `.stamp-slam`'s end rotation). SVG (viewBox 0 0 100 100): outer circle r=44 stroke `meta.ring` sw 3.5 (dashed `5 6` + 0.5 opacity when ghost), inner circle r=35 sw 1.5, arc text `LAYOVER · 2026 · CALICUT · ` on a `textPath` (r=33 circle path), center `meta.label` (13px), `CLEARED`/`PENDING` (8px), ink smudge circle at (68,34) only when earned. Ghost = `.ghost-stamp` on the `<svg>`.

**MissionTimeline internals:** `offsets = missionOffsets(plan)`; `fmtClock()` renders `T+HH:MM` start and `ends T+HH:MM` (`offset + m.durationMin`). `CATEGORY_ICONS` maps eat→UtensilsCrossed, explore→Compass, chill→Coffee, move→Footprints, weird→Sparkles, rest→Armchair (fallback `Compass`, meta fallback `CATEGORY_META.chill`). Toggle button: `min-h-11 min-w-11` (44px), `aria-pressed`, `aria-label="Complete|Undo mission: {title}"`, filled with `meta.ring` when done. `light=true` → ink-on-paper (`text-[#17150f]`/`text-[#6f6a5c]`); `light=false` → terminal tokens (`text-foreground`/`text-muted-foreground`).

**missionOffsets math:** `available = max(totalDurationMin − bufferMin, 30)`; if Σ mission durations > available, every duration scales down by `available / totalMission`; starts accumulate sequentially. So T+ times are **relative**, compressed to fit the real window.

**GenerationStatus:** cycles `line` through the 6 `GATE_CONTROL_LINES` every 1100ms (`setInterval` + cleanup). Exists because `/api/ai/plan` takes ~10–20s live — latency as showmanship (PLAN.md risk register). Radar dots staggered `animationDelay: i * 0.22s`; bottom bar reuses `.ticker` as an endless progress bar.

## Reference

### Props
| Component | Prop | Type | Notes |
|---|---|---|---|
| `BoardingPassCard` | `plan` | `Plan` | required |
| | `done` | `Record<number, boolean>` | index-keyed completion map |
| | `onToggleMission` | `(index: number) => void` | wired to page's `toggleMission` |
| | `source` | `string` = `"ai"` | `"demo"` → TRAINING MODE chip |
| `MissionTimeline` | `plan`, `done` | as above | |
| | `onToggle` | `(index: number) => void` | |
| | `light` | `boolean` = `true` | true=on-paper, false=terminal |
| `StampBadge` | `category` | `MissionCategory` | key into `CATEGORY_META` |
| | `earned` | `boolean` | ghost state when false |
| | `index` | `number` = `0` | picks rotation |
| | `size` | `number` = `76` | pass uses 66 |
| | `animate` | `boolean` = `true` | false → static rotate, no slam |
| `GenerationStatus` | `airportLabel` | `string` | page passes `` `${iata} · ${city}` `` |

### CATEGORY_META (stamps & timeline colors)
| Category | Label | ink / ring |
|---|---|---|
| `eat` | EAT | `#c2452d` |
| `explore` | EXPLORE | `#2d7d74` |
| `chill` | CHILL | `#8a6d3b` |
| `move` | MOVE | `#5b5b8a` |
| `weird` | WEIRD | `#a3497c` |
| `rest` | REST | `#6f6a5c` |

### GATE_CONTROL_LINES (in cycle order)
`CONTACTING GATE CONTROL…` → `NEGOTIATING WITH SECURITY…` → `SCOUTING TERMINAL SECRETS…` → `BRIEFING YOUR GUIDE…` → `STAMPING DOCUMENTS…` → `FILING FLIGHT PLAN…`

## Extend tonight (recipes)
1. **Share-card / PNG export:** add a button in the summary row next to ANNOUNCE/POSTCARD; give the `<article>` in `boarding-pass-card.tsx` an `id="pass-root"`; on click `dynamic(() => import("html-to-image"))` → `toPng(document.getElementById("pass-root"))` → download. The pass is self-contained (CSS barcode/QR), so it screenshots cleanly.
2. **Sound on stamp slam:** in page's `toggleMission`, when `next[i]` flips true, `new Audio("/sfx/stamp.mp3").play()`. Must run inside the click handler (mobile autoplay policy). Alternative: `onAnimationEnd` on the `.stamp-slam` wrapper in `StampBadge`.
3. **Change pass copy:** header strings in `boarding-pass-card.tsx` (`LAYOVER ADVENTURE PASS`, `YOUR CURRENT SPOT`, `MISSION MANIFEST`), arc text in `stamp-badge.tsx` (`LAYOVER · 2026 · CALICUT · ` — keep ≤ ~26 chars or it wraps the arc), footer `GATE ∞` line.
4. **Delay re-planner hook point:** add a DELAY button in the summary row; compute consumed time from `missionOffsets(plan)` + `done`, call `/api/ai/plan` again with the remaining `durationMin`, then `setPlan(newPlan); setDone({})`. Give `<BoardingPassCard key={passId}>` (or any plan-derived key) so `.pass-enter` replays — CSS animations only restart on remount/class re-add.
5. **Passport/gallery view reusing stamps:** `StampBadge` is pure & props-driven — render a grid per archived trip with `size={88} animate={false}` (static rotation via the inline transform branch, no slam). Use `earned={false}` to show which categories a trip never collected (ghost preview).

## Troubleshooting (symptom → cause → fix)
| Symptom | Cause | Fix |
|---|---|---|
| Stamp never slams | `earned={!!done[i]}` — `done` isn't updating | check `onToggleMission` is page's `toggleMission` (not a no-op); `done` resets to `{}` on each `generate()` by design |
| Stamp shows but faint/dashed | that's the **ghost state** (`earned=false` → `.ghost-stamp`, opacity .16, `PENDING`) | not a bug; complete the mission |
| Slam won't replay (undo→redo works, same plan twice doesn't) | CSS animation restarts only when `.stamp-slam` is removed & re-added, or element remounts | toggling `done` handles it; for replaying on a *new* plan, remount via a plan-derived `key` (see recipe 4) |
| Perforation invisible | `.perforation-v/h` + `.notch` paint `var(--background)` — only reads as holes over the dark canvas; vertical is `hidden lg:block`, horizontal `lg:hidden` | test at the right breakpoint; keep them on paper-section edges over the page background, don't wrap in a container with its own bg |
| Mission T+ times look wrong | they're relative offsets from arrival (`T+00:00`), not wall clock; missions are scaled down when Σ durations exceed `totalDurationMin − bufferMin` | expected math in `missionOffsets`; to change it, edit that one function (both timeline and any future planner read it) |
| TRAINING MODE chip missing | chip renders only when `source === "demo"` | verify page passes `source={source}` and API returned `data.source === "demo"` (or demo toggle on) |
| Two stamps share rotation/ids | `index` prop identical for both, or `useId` collisions from copied SVG ids | pass unique `index`; keep the `useId().replace(/[:]/g,"")` id scheme |
| Status lines don't cycle | `setInterval` leaked / `GATE_CONTROL_LINES` import broken | effect returns `clearInterval` cleanup; import from `@/lib/demo-mode` |

## Verify it works
1. `npm run dev` → `http://localhost:3000/`.
2. Fast path: flip **DEMO MODE** on (footer), pick **DXB**, click **REQUEST ADVENTURE** → `GenerationStatus` cycles all 6 gate-control lines (~1.1s each) → pass slides in (`.pass-enter`): `BED → DXB` (DXB in red `#c2452d`), three chips (WINDOW/VIBE/SEC. BUFFER), TRAINING MODE chip visible.
3. Click a mission check button (44px square, right side): node fills with the category color, title gets struck through, matching stamp **slams** onto the stub (big+blur → overshoot → settles rotated). Click again → stamp returns to ghost `PENDING`.
4. Complete every mission: header chip flips to teal `MISSION CLEAR`, `✦ PERFECT RUN — N/N CLEARED` appears under the stamps.
5. Persistence: with server up, toggling a mission fires `PATCH /api/missions/{id}` (Network tab) and the wall's `missionsDone` count updates on next `/api/trips?limit=10` poll.
6. Live AI path (wifi): `curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' -d '{"iata":"DXB","city":"Dubai","country":"UAE","durationMin":240,"vibe":"explorer"}' | head -c 400` → `{"ok":true,"plan":{…}` — the same `plan` JSON the pass renders.
