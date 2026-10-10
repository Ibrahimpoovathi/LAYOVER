# 03. AI mission pipeline

> Status: ✅ · Last verified: 2026-10-10 · Owner: Z.ai Code (main) · Docs: Task 2-b

## TL;DR
Three backend routes on `z-ai-web-dev-sdk` turn an airport + layover window into a validated mission plan (`/api/ai/plan`), a vintage postcard image (`/api/ai/postcard`), and a TTS gate announcement (`/api/ai/announce`). Every route has a hard timeout and a graceful fallback, so a flaky AI API degrades the demo instead of killing it.

## Why it exists (rubric tie)
This is the "What was built" (20) spine — a real full-stack AI pipeline with validation, caching and fallbacks (Execution 5). The mission/timing/buffer logic is the travel soul of the app (Travel 10), and the live ~10–20 s generation is the demo moment (Demo 5). See PLAN.md §1 and §3.

## Files
| File | Responsibility |
|---|---|
| `src/app/api/ai/plan/route.ts` | LLM mission plan: validate → cache → generate → zod → fallback |
| `src/app/api/ai/postcard/route.ts` | Image gen — 1344×768 vintage postcard |
| `src/app/api/ai/announce/route.ts` | TTS WAV stream, voice `"jam"` |
| `src/lib/plan-schema.ts` | zod contract (`planSchema`, `missionSchema`, `VIBES`, `CATEGORY_META`, `fmtDuration`, `missionOffsets`) |
| `src/lib/demo-mode.ts` | `DEMO_PLANS` + `genericDemoPlan` (fallback payloads, see doc 05) |
| `src/lib/airports.ts` | `findAirport()` — fills city/country defaults for the plan prompt |
| `src/app/page.tsx` | client calls: `generate()`, `makePostcard()`, `playAnnouncement()` |

## How it works

### POST /api/ai/plan — the spine
`runtime = "nodejs"`, `maxDuration = 60`. Body:
`{ "iata": "DXB", "durationMin": 320, "vibe": "explorer", "city": "Dubai", "country": "UAE", "forceDemo": false }`
(city/country/forceDemo optional). Order of operations — every step is load-bearing:

1. **Parse + normalize** — invalid JSON body → 400 `"Invalid JSON body"`. `iata` = uppercase first 3 chars; `durationMin` clamped **60–720** (default 180 via `Number(body.durationMin) || 180`); `vibe` default `"explorer"`. `findAirport(iata)` fills missing `city`/`country` from the bundled dataset.
2. **Validate IATA** — `/^[A-Z]{3}$/` else 400 `"Valid 3-letter IATA code required"`.
3. **forceDemo short-circuit** — returns `demoFallback(...)` with `source:"demo"` **before the cache is ever touched** (demo mode never reads *or writes* the cache).
4. **In-memory cache** — module-level `Map`, `CACHE_TTL_MS = 10 * 60 * 1000` (10 min), key `` `${iata}:${durationMin}:${vibe}` ``. Fresh hit → `{ ok: true, plan, source: "cache" }`.
5. **Generate** — `ZAI.create()` → `chat.completions.create` with `SYSTEM_PROMPT` ("GATE CONTROL" persona, sent as an `assistant`-role message — intentional, don't casually "fix" to `system`) + a `user` prompt embedding the vibe hint from `VIBES`. `thinking: { type: "disabled" }`. Wrapped in `Promise.race` against a **48 s** timeout (`"Gate control timeout"`).
6. **extractJson()** — robust parsing: rewrites ```` ```json ```` fences, tries the raw text then each fenced block, slices first `{` … last `}`, `JSON.parse`. All candidates fail → throw `"No parseable JSON in model response"`.
7. **planSchema.parse** (zod, contract below). Failure here = fallback.
8. **Hard-correction** — fields the model may drift on are overwritten: `airport.iata` ← input, `totalDurationMin` ← requested `durationMin`, `vibe` ← requested; blank `city`/`country` backfilled from input/dataset.
9. **cache.set** → respond `{ ok: true, plan, source: "ai" }`.
10. **Catch-all** — `console.error("[ai/plan] falling back to demo:", msg)`, then HTTP 200 `{ ok: true, plan: demoFallback(...), source: "demo", note: msg }`. **The plan route never fails from the client's view**; `note` carries the underlying error string.

`demoFallback()` prefers `DEMO_PLANS[iata.toUpperCase()]` (with `totalDurationMin: Math.max(durationMin, base.totalDurationMin)` — it never shrinks below the baked window) and otherwise calls `genericDemoPlan(iata, city, country || "Unknown", vibe)`.

### POST /api/ai/postcard
`maxDuration = 120`. Body `{ city, country, vibe, iata? }` — all optional, sliced: city/country ≤60 chars, vibe ≤30, iata uppercase 3. Fixed prompt template (vintage travel postcard, amber/cream sky, terminal silhouette + departing airplane, retro screen-print) ending **"no text, no letters, no watermark"** — image models garble letters, so none are allowed. `zai.images.generations.create({ prompt, size: "1344x768" })` raced against a **100 s** timeout (`"postcard press timeout"`).
- Success: `{ ok: true, source: "ai", imageDataUrl: "data:image/png;base64,…", prompt }`.
- Failure: **HTTP 200** `{ ok: true, source: "none", note: msg }` → page.tsx `makePostcard()` sets `postcardFallback` → UI shows the "PRESS JAMMED — POSTCARD PENDING" card.

### POST /api/ai/announce
`maxDuration = 60`. Body `{ text }` — whitespace-collapsed, trimmed, **capped at 600 chars** (SDK TTS limit is 1024). Empty text → 400 `"text is required"`. `zai.audio.tts.create({ input: text, voice: "jam", speed: 0.95, response_format: "wav", stream: false })` raced against a **45 s** timeout; payload < 100 bytes → `"Empty audio payload"`.
- Success: raw binary body with `Content-Type: audio/wav`, `Content-Length`, `Cache-Control: no-cache`.
- Failure: the one route that errors loudly — `{ ok: false, error: msg }` with **status 503**. page.tsx `playAnnouncement()` builds the sentence from the plan (city, mission count, `fmtDuration` window), fetches, then `new Audio(URL.createObjectURL(await res.blob()))` and `.play()`; failure → toast "Tower is not answering".

### The zod contract — planSchema / missionSchema
zod is the real enforcer; the prompt's stated limits are advisory. Anything outside these bounds = demo fallback.

| Field | Limits |
|---|---|
| `adventureTitle` | string 3–90 |
| `airport.iata` | exactly 3 chars |
| `airport.city` | min 1 · `airport.country` optional, min 1 |
| `vibe` | min 1 |
| `totalDurationMin` | int 60–720 |
| `bufferMin` | int 30–180 |
| `funFact` | 10–220 chars |
| `missions` | array **2–6** of `missionSchema` |
| `mission.title` | 2–80 |
| `mission.description` | 10–280 |
| `mission.durationMin` | int **15–300** |
| `mission.category` | enum `eat · explore · chill · move · weird · rest` |
| `mission.location` | 2–120 |
| `mission.tip` | optional, ≤160 |

`VIBES` (drives the picker *and* the prompt hint): `chill` "slow, cozy, low effort" · `foodie` "eat the terminal" · `explorer` "see everything possible" · `weird` "strange delights only" · `maxout` "squeeze every minute".

### System-prompt design rules (SYSTEM_PROMPT)
- Respond with ONE valid JSON object, no markdown fences, no commentary.
- `bufferMin` 30–150 per the prompt (realistic immigration+security) — note zod tolerates up to 180.
- Mission durations in multiples of 5; **no mission under 15 min**; sum(missions) + buffer ≤ totalDurationMin.
- **2–5 missions** per the prompt (zod tolerates up to 6 — deliberate headroom).
- **At least one `eat` mission unless vibe is `weird`**; **exactly one `weird`/playful mission** for charm; vary categories.
- Realistic airport features only (lounges, observation decks, showers, food, art, transit). If a city exit is unrealistic for the window, stay airside and say why in a tip.

## Reference

| Endpoint | Body | Response (success) | Cache / timeout |
|---|---|---|---|
| `POST /api/ai/plan` | `{ iata, durationMin 60–720, vibe, city?, country?, forceDemo? }` | `{ ok:true, plan, source:"ai"\|"cache"\|"demo", note? }` | 10-min Map cache keyed `iata:durationMin:vibe`; forceDemo bypasses; LLM timeout 48 s |
| `POST /api/ai/postcard` | `{ city, country, vibe, iata? }` | `{ ok:true, source:"ai", imageDataUrl, prompt }` or `{ ok:true, source:"none", note }` | none; image timeout 100 s; always HTTP 200 |
| `POST /api/ai/announce` | `{ text ≤600 }` | `audio/wav` binary (200) | none; TTS timeout 45 s; errors → 503 JSON |

`source` values the UI sees: `"ai"` fresh LLM · `"cache"` replayed within TTL · `"demo"` forceDemo or fallback. `BoardingPassCard` shows the TRAINING MODE badge only when `source === "demo"`.

## Extend tonight (recipes)
1. **Tune the persona / add a new vibe** — vibes live in `VIBES` in `src/lib/plan-schema.ts` (`{ id, label, hint }`); the hint is auto-embedded into the user prompt, so adding an entry lights up `VibePicker` + prompt with zero route edits. For new *behavior* (like "weird" skipping the eat mission), edit `SYSTEM_PROMPT` in `src/app/api/ai/plan/route.ts`. Keep the prompt's schema block in sync with `planSchema` — zod is what actually rejects.
2. **Change plan size / duration limits** — edit `planSchema`/`missionSchema` in `plan-schema.ts` AND mirror the prose in `SYSTEM_PROMPT` ("2-5 missions", "No mission under 15 min", buffer range). If you widen `totalDurationMin`, also relax the input clamp `Math.min(Math.max(Number(body.durationMin) || 180, 60), 720)` in plan/route.ts.
3. **Add a new AI route with the same pattern** — copy the skeleton: `runtime = "nodejs"` + `maxDuration`; body parse in try/catch → 400; `ZAI.create()`; `Promise.race` against a `setTimeout(() => reject(...), TIMEOUT)` ≤ maxDuration; JSON routes reuse `extractJson` + zod `.parse`; on catch `console.error("[ai/xxx] …")` and return graceful JSON (`ok:true` + `source:"none"` when the UI has a fallback, 503 only when there is no meaningful fallback like binary audio).
4. **Add streaming later** — plan/route.ts currently awaits the whole completion. To stream: `stream: true` on `chat.completions.create`, return a `ReadableStream` of deltas, consume via `res.body.getReader()` client-side. For demo parity push `fakeStreamChunks(plan)` (already exported in demo-mode.ts) through the same stream shape, and cache the assembled final plan exactly as today so `source:"cache"` keeps working.
5. **Bust / extend the cache** — it's a module-level `Map`: per dev-server process, **cleared on restart**, TTL 10 min (`CACHE_TTL_MS`), key is only `iata:durationMin:vibe` (city/country don't participate — same trio always hits). Lengthen TTL via the constant; persist across restarts by swapping the Map for sqlite/file. While tuning prompts, just restart the dev server instead of waiting out the TTL.

## Troubleshooting (symptom → cause → fix)
| Symptom | Cause | Fix |
|---|---|---|
| `source:"demo"` when you expected AI | LLM 48 s timeout, unparseable JSON, or zod rejection | Read `note` in the response body; grep dev log for `[ai/plan] falling back to demo:` — the message names the real cause |
| `note: "No parseable JSON in model response"` | Model wrapped JSON in prose/fences extractJson couldn't slice | Tighten SYSTEM_PROMPT output rules; retry — one flaky completion shouldn't repeat |
| Same request always falls back to demo | One field consistently violates zod | Check `note` against the contract table: missions 2–6, mission `durationMin` 15–300 int, `bufferMin` 30–180, `funFact` 10–220, category enum of 6, `adventureTitle` 3–90 |
| Plan takes ~48 s then goes demo | SDK hang / dead key | Working-as-designed guard (`maxDuration = 60` caps the route); fix network/key, or compare instantly with `forceDemo:true` |
| Postcard shows "PRESS JAMMED — POSTCARD PENDING" | 100 s image timeout or empty base64 → `source:"none"` | Expected graceful path; retry once; check the `[ai/postcard]` log line for the note |
| Announce toasts "Tower is not answering" | TTS error / 45 s timeout → route returned 503 | Check `[ai/announce]:` in the dev log; text >600 chars is silently sliced, empty text is a 400 |
| Same plan keeps returning | Cache hit (`source:"cache"`) | Wait 10 min or restart the dev server; `forceDemo:true` shows what the demo locker would serve |

## Verify it works
In the sandbox the app runs on **localhost:3000** (`npm run dev` if it isn't up).

```bash
# 1. Live AI plan (real LLM, ~7–20 s)
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"DXB","durationMin":320,"vibe":"explorer"}' | head -c 400

# 2. Run it again — second response should say "source":"cache"

# 3. Instant demo path (bypasses cache, no LLM latency) — expect "source":"demo"
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"CCJ","durationMin":200,"vibe":"foodie","forceDemo":true}' | head -c 300

# 4. Bad IATA → {"ok":false,"error":"Valid 3-letter IATA code required"}
curl -s -X POST localhost:3000/api/ai/plan -H 'Content-Type: application/json' \
  -d '{"iata":"D1","durationMin":120,"vibe":"chill"}'

# 5. Postcard — huge base64 PNG on success; {"ok":true,"source":"none",...} on failure
curl -s -X POST localhost:3000/api/ai/postcard -H 'Content-Type: application/json' \
  -d '{"city":"Dubai","country":"UAE","vibe":"explorer","iata":"DXB"}' | head -c 200

# 6. Announce — saves a WAV and shows audio/wav response headers
curl -s -D - -o /tmp/announce.wav -X POST localhost:3000/api/ai/announce \
  -H 'Content-Type: application/json' \
  -d '{"text":"Attention travellers. Now boarding the layover adventure at gate seven."}' | head -5
file /tmp/announce.wav
```

UI click-path: pick DXB → REQUEST ADVENTURE → `GenerationStatus` cycles `GATE_CONTROL_LINES` → boarding pass renders → ANNOUNCE plays audio, POSTCARD swaps in the image (or the PRESS JAMMED card on failure).
