# 11. EVERY BODY BOARDS — access profiles (IATA SSR)

> Status: ✅ · Last verified: 2026-10-10 ~23:30 IST · Owner: main agent (Task 14)

## TL;DR
The planner grows an **ASSISTANCE CODE · SSR** row. A traveler files a real
IATA Special Service Request — `WCHR` (step-free), `DPNA` (low-stim),
`DEAF` (visual announcements) — and the whole pipeline plans around the body:
the LLM gets a directive, the missions carry access metadata, the artifact
prints the code like any airline ticket, and the terminal itself adapts.
USP answer to "another team has the same idea": *our board plans your body,
not just your clock.*

## Why it exists (rubric tie)
- **Creativity 10 / impact**: every travel planner hands a wheelchair user the
  same "walk 15 min" plan. Time-boxing is ableist by default; we extend the
  core mechanic (budgeted missions) to energy + access.
- **Travel 10**: WCHR/DPNA/DEAF are codes travelers actually book with —
  authenticity judges who fly will recognize instantly.
- **Demo 5**: DPNA visibly stills the terminal (blink/flicker/march/ticker
  stop), DEAF captions announcements on a red LED strip, WCHR chips every
  mission STEP-FREE with roll distances. Three flips, three visible changes.

## The three codes
| SSR | Label | The promise enforced in code | UI proof |
|---|---|---|---|
| `WCHR` | Step-Free | every mission step-free, rolls ≤ 400 m | teal `STEP-FREE` chips, `≈N M` chips, `TOTAL ROLL ≈ X M` line on ticket |
| `DPNA` | Low-Stim | quiet, predictable, bursts ≤ 600 m | `QUIET` chips, `· QUIET ROUTE` line, **terminal motion stops** (`.low-stim` class) |
| `DEAF` | Visual Announcements | visual-first missions | **CAPTION FEED** LED strip under the ticket: captions every TTS announcement + `LIVE MIC` (browser speech recognition) |

## Data flow
1. `AccessPicker` (planner) → `accessProfile` in POST `/api/ai/plan`.
2. Route injects the profile `directive` into the system prompt + requests
   `distanceM` / `stepFree` / `sensory` on every mission.
3. **Never trust the model**: `applyAccessProfile()` (plan-schema.ts)
   deterministically caps distances, forces `stepFree`/`sensory`, and stamps
   `accessProfile` — for LLM plans, demo locker, showcase and offline
   fallbacks alike. Chips on the ticket are always true.
4. Profile rides the cache key (`...:vibe:access`) — profiles never collide.
5. POST `/api/trips` persists `accessProfile` + mission access columns;
   GET feeds the wall, which prints a small `SSR <CODE>` badge per trip.

## Files
| File | Responsibility |
|---|---|
| `src/lib/plan-schema.ts` | `ACCESS_PROFILES` (+IATA directives), mission access fields, `applyAccessProfile`, `walkTotalM` |
| `prisma/schema.prisma` | `Trip.accessProfile`, `Mission.distanceM/stepFree/sensory` |
| `src/app/api/ai/plan/route.ts` | profile parsing, prompt directive, deterministic normalization, cache key |
| `src/app/api/trips/route.ts` | persist + serve accessProfile |
| `src/components/terminal/access-picker.tsx` | SSR selector (radiogroup) |
| `src/components/terminal/led-caption-strip.tsx` | DEAF caption feed + LIVE MIC (feature-detected, fails quiet) |
| `src/components/terminal/mission-timeline.tsx` | per-mission access chips |
| `src/components/terminal/boarding-pass-card.tsx` | ACCESS·SSR meta cell + stub `SSR <CODE>` + roll line |
| `src/components/terminal/bus-ticket-card.tsx` | same treatment for the road ticket |
| `src/app/page.tsx` | state, API body, caption strip wiring, `.low-stim` root class, wall badge |
| `src/app/globals.css` | `.low-stim` kinetic mute (mirrors `prefers-reduced-motion`) |

## Verify it works
```bash
agent-browser open http://localhost:3000
# toggle DEMO MODE on, type DXB, pick the suggestion
agent-browser find role radio click --name "WCHR· Step-Free"
# click REQUEST ADVENTURE → pass shows ACCESS·SSR WCHR, STEP-FREE chips
agent-browser eval "document.querySelector('[data-mode]').className"   # +low-stim only for DPNA
# DPNA: click DPNA · Low-Stim → blink/ticker animationName === 'none' after generate
# DEAF: click DEAF · Visual Announcements → CAPTION FEED strip, press ANNOUNCE → text appears
curl -s "localhost:3000/api/trips?limit=1" | jq '.trips[0].accessProfile'   # "wchr"
```
Screenshots: `shots/84` (WCHR boarding pass) `85` (DPNA pass + QUIET chips)
`86-88` (wall SSR badge) `89-90` (day-mode picker + pass) `91` (road WCHR
ticket) `92` (final DPNA regression).

## Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| Access chips missing on ticket | profile not sent / stale route chunk | check POST body has `accessProfile`; curl the trips API for `accessProfile` |
| `.low-stim` present but things still blink | stale CSS chunk (hits repeatedly) | curl served CSS, grep `low-stim`; content-change + reload, else restart dev server clean |
| LIVE MIC button missing | browser has no SpeechRecognition (non-Chromium) | expected — captions from ANNOUNCE still work |
| Wall shows no SSR badge | trip saved before the feature (accessProfile `none`) | generate a fresh trip with a code |

## v2 — LIVE MIC dual-engine + honest faults · 2026-10-10

* User report: "speech to text in deaf section is not working properly."
  Root cause: the strip relied only on browser SpeechRecognition, which
  fails silently in sandboxed iframes (`service-not-allowed`), on Firefox/
  Safari (missing), and on flaky networks (`network`) — "fails quiet"
  meant judges saw nothing.
* Fix 1 — ENGINE A kept but hardened: error codes mapped; `not-allowed` /
  `network` / unknown faults hand off to engine B instead of dying.
* Fix 2 — ENGINE B (new): MediaRecorder clips (~7 s) → base64 →
  `POST /api/ai/transcribe` → `zai.audio.asr.create` → text appended to the
  LED feed. Uses our own backend, so it works wherever the terminal works.
* Fix 3 — the honest machine: every abnormal state prints ON the board
  ("NO MICROPHONE FOUND ON THIS DEVICE", "MIC BLOCKED BY THE BROWSER — …",
  "PA SIGNAL UNCLEAR — TRY SPEAKING CLOSER", "CAPTION CHANNEL DOWN — …").
  No more silent failure.
* Cost: transcribe is a CostKind — counted in the rolling hourly budget;
  429 prints "CAPTION CHANNEL RESTING" instead of spending.
* Pipeline proof (no mic needed): TTS a line via `/api/ai/announce`, base64
  it, POST to `/api/ai/transcribe` → returns the line's text back.
* Files: `led-caption-strip.tsx` (rewritten), `api/ai/transcribe/route.ts`
  (new), `cost-guard.ts` (+`transcribe`).
* Note: in the sandboxed preview iframe both mic engines may be blocked by
  the platform — the LED will say so and point at "OPEN IN A NEW TAB".
  Announcement captions never depended on the mic and always work.
