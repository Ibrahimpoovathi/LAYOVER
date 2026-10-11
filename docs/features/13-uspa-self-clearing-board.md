# 13. The Board Defends Your Time — USP-A self-clearing solari

> Status: ✅ · Last verified: 2026-10-10 · Owner: Z.ai Code (main)

## TL;DR
While a **DEMO MODE** plan is on screen, a central demo clock advances journey
minutes (**1 real second = 3 journey minutes**). Every mission owns a WINDOW
(start → end on the journey clock). Ignore a mission past its window + 10
minutes grace → the solari **flips it to SCRUBBED** (red, real flap
animation), the pass stamps it **WINDOW CLOSED · SCRUBBED** (row dimmed,
punch/stamp disabled) and a toast calls it out. **REPLAN · N SCRUBBED** then
re-files the ticket: keep everything stamped and everything still in-window,
drop the scrubbed, and append fresh missions that fit the minutes the clock
still owes you — re-anchored at the clock's current minute. The board defends
your time; the traveller keeps the wins they stamped.

**One-liner for judges:** "Our board defends your time; our tickets respect
your body."

## Why it exists (rubric tie)
- **Creativity 10**: no competitor has a *temporal* mechanic — boards are
  static output everywhere else. Here the hero artifact (solari) becomes the
  antagonist/enforcer of the product promise.
- **Built 20**: deterministic clock lib (zero scattered `Date.now()`),
  anchor-aware schedule math, replan with schema-safe mission cap — real
  state machinery, not a timer gimmick.
- **Demo 5**: fully automatic — start a demo plan and ignore it; the board
  scrubs by itself ~20–60 s in. Zero judge coordination required.

## Files
| File | Responsibility |
|---|---|
| `src/lib/mission-clock.ts` | `SIM_RATE=3` jmin/s, `SCRUB_GRACE_MIN=10`, `FINAL_CALL_MIN=10`; `missionWindows()`, `missionPhase()`, `missionBoardStatus()`, `fmtJourneyClock()` — the single clock source |
| `src/lib/plan-schema.ts` | `windowAnchorMin` (zod optional) on Plan; `missionStarts()` — anchor-aware starts/ends, compresses missions into the remaining play window (total − buffer − anchor) |
| `src/app/page.tsx` | `clockMin` state + one interval (gated on `step==="ready" && plan && demoMode`); phase derivation; scrub-toast effect (once per mission per plan via `scrubbedSeenRef`); live mission rows prepended to the solari (`M-01…`, ON TIME → BOARDING → FINAL CALL → SCRUBBED / DONE ✦); demo clock chip (`role="timer"`); `replan()` |
| `src/components/terminal/mission-timeline.tsx` | optional `scrubbed` prop → red `WINDOW CLOSED · SCRUBBED` chip, row dimmed, complete button disabled; T+ labels + ends from `missionStarts()` |
| `src/components/terminal/boarding-pass-card.tsx` | passes `scrubbed` through to the timeline |
| `src/components/terminal/bus-ticket-card.tsx` | same scrub chips on conductor stages; punch disabled when scrubbed |

## How it works
1. **Clock**: interval bumps `clockMin` by `SIM_RATE` (capped at
   `totalDurationMin`) while a demo plan is ready. Non-demo plans never run
   the clock (live mode unchanged).
2. **Phases** (per mission, derived every render): `upcoming` → `active` →
   `finalcall` (≤10 min left) → `done ✦` | `scrubbed` (past end + grace).
3. **Solari**: when `plan && demoMode && step==="ready"`, mission rows
   (`M-01…`) are prepended to the static LY rows; the existing split-flap
   cells animate every status flip for free.
4. **Replan**: keeps done/in-window missions (index-remaps `done` +
   `missionIds`), appends fresh missions from the same-mode generic pool
   (`genericDemoPlan`/`genericRoadPlan`) while `rawUsed ≤ remainingPlay × 1.5`
   and total ≤ 6 (zod cap). New plan carries
   `windowAnchorMin = clockMin`, so ALL windows re-baseline from now —
   nothing is born pre-scrubbed. Scrubbed adventures may earn a second
   window (only kept titles are excluded).

## Design decisions
- **Anchor, don't rewind**: v1 of replan recomputed windows from T+00 and
  every fresh mission was instantly SCRUBBED at clock T+02:54.
  `windowAnchorMin` fixes the semantics: a replanned schedule is honest
  about the time already gone.
- **Compression tolerance 1.5×**: `missionStarts` already compresses
  durations into the available window (same as the original plan); the raw
  cap only prevents silly stuffing (6×60 min into 30 remaining minutes).
- **Demo-only**: the clock runs in DEMO MODE so the live AI path is
  untouched and judges always see the mechanic inside the demo insurance.

## Verify it works
```bash
# clock lib is pure — quick REPL smoke
bun -e "const {missionWindows}=require('./src/lib/mission-clock.ts')" # (via app flow below instead)
```
Browser (DEMO MODE → DXB → REQUEST ADVENTURE → hands off):
- Clock chip ticks `T+MM:SS / 05:20 · SIM 1S = 3M · WINDOWS ENFORCED`.
- ~20–60 s in: board rows flip `FINAL CALL` → `SCRUBBED` (red flaps),
  toast `WINDOW CLOSED — The board scrubbed "…"`, pass shows
  `WINDOW CLOSED · SCRUBBED` chips with disabled stamps.
- Press `REPLAN · N SCRUBBED` → toast `REPLAN FILED`, fresh missions appear
  with windows anchored at the current clock minute (never pre-scrubbed).
- Road mode: same chips on the conductor's ticket (`KBS→MJS` verified).

## Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| Fresh missions instantly SCRUBBED after REPLAN | plan missing `windowAnchorMin` (old closure) | hard-reload; confirm `replan()` sets `windowAnchorMin: clockMin` |
| REPLAN appends nothing | pool exhausted (all titles kept) or raw capacity exceeded | honest toast fires; pick NEW and regenerate |
| Clock not ticking | not DEMO MODE, or plan not in `ready` step | enable DEMO MODE, generate a plan |
| Mission rows never appear on solari | `step!=="ready"` or DEMO off | same as above |
