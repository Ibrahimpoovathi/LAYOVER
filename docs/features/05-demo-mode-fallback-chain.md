# 05. Demo mode & fallback chain

> Status: ✅ · Last verified: 2026-10-10 · Owner: Z.ai Code (main) · Docs: Task 2-b

## TL;DR
Three stacked safety layers guarantee the 8 AM demo never dies: (1) a DEMO MODE toggle that serves hand-baked plans instantly, (2) a server-side fallback to those same plans on any AI failure, (3) a fully offline client that can still search airports and render a generic plan with zero network. Degraded mode is branded TRAINING MODE so it reads as a feature, not a failure.

## Why it exists (rubric tie)
Directly protects Execution (5) and Demo (5) — "the 8 AM demo NEVER dies" is a designed feature, not a patch (PLAN.md §1, §5 risk register: dead venue wifi / API outage). The theatrical TRAINING MODE framing turns degraded mode into part of the show (Creativity 10).

## Files
| File | Responsibility |
|---|---|
| `src/lib/demo-mode.ts` | `DEMO_PLANS` (DXB/SIN/CCJ), `genericDemoPlan()`, `GATE_CONTROL_LINES`, `fakeStreamChunks()` |
| `src/app/api/ai/plan/route.ts` | layers 1+2 server-side: forceDemo short-circuit + catch-all fallback |
| `src/app/page.tsx` | toggle UI, `forceDemo: demoMode` in the request body, layer-3 catch → local `genericDemoPlan` |
| `src/components/terminal/boarding-pass-card.tsx` | TRAINING MODE badge when `source === "demo"` |
| `src/components/terminal/generation-status.tsx` | cycles `GATE_CONTROL_LINES` every 1100 ms |
| `src/lib/airports.ts` | offline airport search over the bundled dataset (layer-3 input, no network) |

## How it works — the 3-layer chain

### Layer 1: DEMO MODE toggle (deliberate, instant)
- The toggle exists twice in page.tsx, both driving the same `demoMode` state: header (label `DEMO MODE`, `hidden sm:flex` — desktop) and sticky footer (label `DEMO`, `sm:hidden` — mobile). A `WifiOff` icon tints amber when engaged.
- `generate()` sends `forceDemo: demoMode` in the POST body to `/api/ai/plan`.
- Server-side, the `body.forceDemo` check sits **before** the cache lookup, under the comment *"demo mode NEVER reads the cache — it must always serve the demo locker"* → instant `demoFallback()` response with `source: "demo"`. Nothing is written to the cache either, so demo runs never poison real ones.
- `demoFallback()` picks `DEMO_PLANS[iata.toUpperCase()]` if present (overrides `vibe` with the requested one; `totalDurationMin: Math.max(durationMin, base.totalDurationMin)` — never shrinks below the baked window), else `genericDemoPlan(iata, city, country || "Unknown", vibe)`.
- UI tells the story: the planner header flips to `DEMO LOCK ENGAGED` (vs `GATE CONTROL: ONLINE`), and `BoardingPassCard` renders the **TRAINING MODE** badge only when its `source` prop is `"demo"` — page.tsx sets that from `data.source`. Wall cards show `TRAINING` / `LIVE` from the saved trip's `source` field.

### Layer 2: server-side fallback (transparent, still HTTP 200)
Any failure inside the plan route's try block — `ZAI.create()` throws, the 48 s timeout fires, `extractJson` can't parse, zod rejects — lands in the catch: `{ ok: true, plan: demoFallback(...), source: "demo", note: msg }`. Indistinguishable from layer 1 except via `note`. If the toggle was OFF, page.tsx also toasts *"Gate control unreachable — dispatched a backup adventure from the demo locker instead."* Companion routes degrade too: postcard → `source:"none"` (PRESS JAMMED card), announce → hard 503 with an apologetic toast.

### Layer 3: offline client (no network at all)
If even the fetch to `/api/ai/plan` throws (dev server down, wifi fully dead), page.tsx's catch builds **`genericDemoPlan(airport.iata, airport.city, airport.country, vibe)` locally in the browser**, sets `source: "demo"`, and toasts *"Running on internal power — network is down, the adventure continues regardless."* Input never needed the network anyway: `AirportCombobox` searches the bundled `AIRPORTS` array via `searchAirports()` — offline by construction.

### demo-mode.ts exports
| Export | What it is |
|---|---|
| `DEMO_PLANS` | `Record<string, Plan>` with three bespoke plans: **DXB** "The Golden Hour Layover" (explorer, 320 min, buffer 90 — camel-milk gelato recon, observation-deck sunset run, snooze-bay nap pods, midnight souk duty-free weirdness); **SIN** "Operation: Jewel Drop" (maxout, 260 min, buffer 75 — Rain Vortex speedrun, kaya toast verdict, rooftop pool spectating, free-tour desk check); **CCJ** "The Kozhikode Night Shift" (foodie, 200 min, buffer 60 — sulaimani tea ceremony, banana-chip procurement, runway-edge stargazing, seat marathon) |
| `genericDemoPlan(iata, city, country, vibe)` | "The ${city} Dead-Hour Circuit" — 240 min, buffer 75, 4 missions (window-seat chill, local-snack eat, concourse-lap move, gate-nap rest); interpolates the city name so any airport feels hand-written |
| `GATE_CONTROL_LINES` | 6 uppercase theatrical lines — "CONTACTING GATE CONTROL…", "NEGOTIATING WITH SECURITY…", "SCOUTING TERMINAL SECRETS…", "BRIEFING YOUR GUIDE…", "STAMPING DOCUMENTS…", "FILING FLIGHT PLAN…" — cycled by `GenerationStatus` every 1100 ms, turning AI latency into showmanship |
| `fakeStreamChunks(plan, chunks = 24)` | splits `JSON.stringify(plan, null, 2)` into ~24 slices — pseudo-streaming helper so a future streaming UI can "stream" demo plans identically (no streaming consumer wired yet) |

### Why bespoke plans for DXB / SIN / CCJ
- **DXB** — the prize itself (winner gets a Dubai trip; footer reads "DXB OR BUST"). Judges will type it; it must be flawless.
- **SIN** — the world's most famous layover airport (Jewel's Rain Vortex); the most plausible real layover a judge has actually suffered through.
- **CCJ** — home-turf storytelling: the hackathon is at TinkerSpace **Calicut**. A Kozhikode plan (sulaimani tea, banana chips) proves the product sees *your* airport, not just megahubs — the airport dataset India-boosts search for the same reason.
- The generic plan is charming but airport-agnostic; these three exist so the most likely demo inputs never look like fallbacks. Rule that makes it all coherent: **demo mode NEVER reads the cache** — forceDemo always serves the demo locker directly, so toggling on always feels instant and deterministic.

## Extend tonight (recipes)
1. **Add a bespoke demo plan (e.g. AMS)** — in `src/lib/demo-mode.ts`, add `AMS: { … }` to `DEMO_PLANS`, copying the DXB structure. It must satisfy `planSchema`: 2–6 missions, each `durationMin` int 15–300, `category` from `eat|explore|chill|move|weird|rest`, `bufferMin` 30–180, `funFact` 10–220 chars, `adventureTitle` 3–90, mission `title` 2–80, `description` 10–280, `location` 2–120, `tip` ≤160. Server-side demo + layer-2 fallback pick it up automatically via `DEMO_PLANS[iata]` — no route edits.
2. **Change the theatrical lines** — edit `GATE_CONTROL_LINES` in demo-mode.ts. Keep them UPPERCASE with a trailing ellipsis for the split-flap vibe; changing the count is safe (`(l + 1) % GATE_CONTROL_LINES.length` in generation-status.tsx).
3. **Wire a keyboard shortcut for demo mode** — in page.tsx add a `useEffect` with a `keydown` listener: `if (e.shiftKey && e.key.toLowerCase() === "d") setDemoMode(d => !d)`. Guard against typing in inputs first (`if (e.target instanceof HTMLInputElement) return`) so typing "DXB" doesn't toggle the mode.
4. **Test the chain by going offline** — Layer 3: DevTools → Network → **Offline** → REQUEST ADVENTURE → expect the "Running on internal power" toast + TRAINING MODE badge + the generic plan. Layer 2: with wifi on, break only the SDK (temporarily invalidate its key in env, restart dev server) → response still HTTP 200 with `source:"demo"` and a populated `note`; revert immediately. Layer 1 needs no failure at all — just flip the toggle.
5. **Stream demo mode** — `fakeStreamChunks(plan)` already exists: when you build the streaming client (doc 03, recipe 4), feed these chunks through the same parser so TRAINING MODE streams exactly like a live generation.

## Troubleshooting (symptom → cause → fix)
| Symptom | Cause | Fix |
|---|---|---|
| Toggle is ON but response says `source:"ai"` | `demoMode` state not reaching the request body | Confirm page.tsx sends `forceDemo: demoMode`; if you wrote your own fetch, add the field — the server only honors `body.forceDemo` |
| TRAINING MODE badge missing though the plan is obviously demo | Badge keys off `source`, not the toggle | Check `setSource(data.source)` ran; badge renders only when `source === "demo"` (wall cards read the saved trip's `source` → TRAINING/LIVE) |
| Stale plan after editing SYSTEM_PROMPT or demo plans | Plan cache is module memory with a 10-min TTL | Restart the dev server to bust instantly; demo mode is immune by design (never reads cache) |
| Demo plan renders oddly after schema edits | The demo path does **not** run `planSchema.parse` — no runtime guard on pre-baked plans | Hand-validate: 2–6 missions, 15–300 min each, buffer 30–180, `funFact` ≤220 chars; then restart |
| Offline client shows the generic plan, not bespoke DXB | Layer 3 runs in the browser and only imports `genericDemoPlan` | Expected — bespoke plans live server-side; if needed, also import `DEMO_PLANS` in page.tsx's catch |
| Demo DXB pass says 320 min though the slider said 120 | `demoFallback` never shrinks below the baked window (`Math.max`) | Intentional; to shrink-to-fit, edit `demoFallback()` in plan/route.ts |

## Verify it works
App on **localhost:3000** in the sandbox.

```bash
# Layer 1 — instant bespoke demo (no LLM, bypasses cache). Expect "source":"demo", "Operation: Jewel Drop"
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"SIN","durationMin":260,"vibe":"maxout","forceDemo":true}' | head -c 300

# Layer 1 — unknown airport falls through to the generic plan ("The Amsterdam Dead-Hour Circuit")
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"AMS","durationMin":180,"vibe":"chill","forceDemo":true}' | head -c 300

# Prove forceDemo bypasses the cache: warm it with a real call (source "ai", then "cache"
# on repeat), then re-run with forceDemo — still instant and still "source":"demo".
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"DXB","durationMin":320,"vibe":"explorer"}' | head -c 200
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"DXB","durationMin":320,"vibe":"explorer","forceDemo":true}' | head -c 200
```

UI click-path (layer 1): flip **DEMO MODE** in the header → planner status flips to `DEMO LOCK ENGAGED` → pick CCJ → REQUEST ADVENTURE → pass appears instantly with the **TRAINING MODE** badge and "The Kozhikode Night Shift".

Layer 3 (offline): DevTools → Network → **Offline** (toggle OFF so you exercise the real chain) → REQUEST ADVENTURE → "Running on internal power" toast, TRAINING MODE badge, generic plan. The airport combobox still completes — it reads the bundled dataset.
