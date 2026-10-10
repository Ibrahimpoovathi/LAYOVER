# 02. Input flow & airport data

> Status: ✅ · Last verified: 2026-10-10 · Owner: base toolkit (Task 1)

## TL;DR
The planner form: offline airport combobox + duration slider + vibe chips, all plain state in `page.tsx` (`airport`, `duration`, `vibe`). REQUEST ADVENTURE POSTs `{ iata, city, country, durationMin, vibe, forceDemo }` to `/api/ai/plan`. Airport search is 100% offline (bundled 74-airport dataset, scored client-side); `/api/airports` is only an HTTP mirror of the same `searchAirports()`.

## Why it exists (rubric tie)
- **Built (20)**: real scored search index + keyboard-complete combobox, not a `<select>`.
- **Travel connection (10)**: CCJ (Kozhikode) is entry #0 of the dataset and India gets a +6 search boost — the demo floor is in Calicut, so the home airport resolves instantly, offline.
- **Demo (5)**: typing never waits on a network; the judge's first interaction is instant even on dead venue wifi.

## Files
| File | Responsibility |
|---|---|
| `src/lib/airports.ts` | `Airport` type, `AIRPORTS` dataset (74), `searchAirports()`, `findAirport()` |
| `src/app/api/airports/route.ts` | `GET /api/airports?q=&limit=` — wraps `searchAirports` |
| `src/components/terminal/airport-combobox.tsx` | Offline combobox, keyboard nav, emits full `Airport` |
| `src/components/terminal/duration-slider.tsx` | Range 60–720 min, step 15, 5 presets |
| `src/components/terminal/vibe-picker.tsx` | 5 single-select vibe chips (from `VIBES` in plan-schema) |
| `src/components/terminal/departure-board.tsx` | Split-flap hero (`FlapCell`, `SplitFlapText`, `DepartureBoard`) |
| `src/app/page.tsx` | Owns `BOARD_ROWS`, all planner state, `generate()` |

## How it works

### 1. Dataset (`AIRPORTS`)
`Airport = { iata, icao?, city, name, country, region }`, `region` ∈ `"india" | "asia" | "gulf" | "europe" | "americas" | "oceania" | "africa"`.
**74 entries** (counted from the file; older notes said ~70): 18 India, 8 Gulf, 19 Asia, 14 Europe, 8 Americas, 3 Oceania, 4 Africa. **Order matters**: an empty query returns `AIRPORTS.slice(0, limit)`, so India-first ordering makes CCJ/COK/TRV the default suggestions — CCJ is literally the first entry.
Known quirk: Port Blair is stored as `iata: "IXC2"` (4 chars; real code is IXZ). Harmless for search, but see Troubleshooting — the trips API validates `iata` as exactly 3 chars.

### 2. Search scoring (`searchAirports(query, limit = 8)`)
Trim + lowercase; empty query → first `limit` in dataset order. Otherwise first matching tier wins:

| Match | Score |
|---|---|
| `iata === q` | 100 |
| `iata.startsWith(q)` | 90 |
| `city.startsWith(q)` | 80 |
| `country.startsWith(q)` | 60 |
| `city.includes(q)` | 55 |
| `name.includes(q)` | 40 |
| `country.includes(q)` | 35 |

Then `region === "india"` adds **+6** (only if score > 0) → filter `score > 0` → sort desc → slice. `"koz"` → Kozhikode (80+6=86). An exact IATA prefix (90) beats the India boost.
`findAirport(iata)` = case-insensitive exact IATA lookup; used server-side by `/api/ai/plan` to enrich the prompt.

### 3. `/api/airports` route
`GET /api/airports?q=koz&limit=8` → `{ ok: true, results: Airport[] }`; `limit` defaults 8, clamped ≤ 20; `runtime = "nodejs"`. **The client never calls this** — `airport-combobox.tsx` imports `searchAirports` directly, which is why search works offline. The route exists for curl demos / future clients.

### 4. Combobox (`AirportCombobox`)
Props: `value: Airport | null`, `onSelect: (a: Airport) => void`, `placeholder?` (default `"City, airport or code…"`).
- Results computed synchronously every render: typed → `searchAirports(query, 8)`; empty → `AIRPORTS.slice(0, 6)`.
- Opens on `onFocus` (cancels pending blur timer); closes on `onBlur` after **140 ms** (options also `onMouseDown preventDefault`, so clicks always win); `Escape` closes; typing reopens and resets `active` to 0.
- Keyboard: `ArrowDown`/`ArrowUp` move `active` (clamped `0…results.length-1`); `Enter` selects `results[active]` only when open.
- Emits the **full `Airport` object** via `choose()` → clears query → closes. After selection the placeholder becomes `"CCJ · Kozhikode"` and an IATA chip button appears (clicking it re-fires `onSelect(value)` as a "change" affordance).
- Zero results: `"NO SUCH DESTINATION IN OUR ATLAS — TRY A MAJOR HUB"`.

### 5. Duration slider (`DurationSlider`)
Props `value: number` (minutes), `onChange(v)`. `<input type="range" min={60} max={720} step={15}>` → emits **integer minutes**. `PRESETS = [60, 120, 180, 300, 480]` rendered via `fmtDuration` ("1h"…"8h"), pressed state when `value === p`. Big label = `fmtDuration(value)` → `"5h 20m"` / `"3h"` / `"45m"`. `page.tsx` default: **240**.

### 6. Vibe picker (`VibePicker`)
Renders `VIBES` from `src/lib/plan-schema.ts` — 5 vibes: `chill` (Coffee, "slow, cozy, low effort"), `foodie` (UtensilsCrossed, "eat the terminal"), `explorer` (Compass, "see everything possible"), `weird` (Sparkles, "strange delights only"), `maxout` (Rocket, "squeeze every minute"). Single-select `radiogroup`; selected chip fills amber (`bg-primary` + glow shadow); each chip's `title` shows the hint. `page.tsx` default: **"explorer"**.

### 7. Departure board (split-flap)
- `FlapCell` = one character. On target-char change: wait `delay` ms → `.flipping` class for **60 ms** → swap text. CSS (`.flap-cell`, `.flipping`, `.flap-face`) lives in `globals.css` (doc 01).
- `SplitFlapText({ text, staggerMs = 26 })` — one cell per char, delay `i * staggerMs` → the left-to-right cascade.
- `DepartureBoard({ rows, cycleMs = 7000 })` — `tick` increments every 7 s; view rotates via `rows[(i + tick) % rows.length]`, so all rows stay visible and every cell re-flaps each cycle.
- `BoardRow = { code, dest, info, status, tone?: "amber" | "green" | "red" }`; `code` padded to 6 chars, `dest` uppercased + padded to 16 (clipped by `overflow-hidden` if longer); `info` desktop-only; `status` colored via `TONE_CLASSES`.
- The content itself is **`BOARD_ROWS` in `page.tsx`** (6 rows, `LY-101` "AI MISSIONS" … `LY-106` "DUBAI · FINAL CALL"), passed as `<DepartureBoard rows={BOARD_ROWS} />`.

### 8. Input → AI flow (`page.tsx`)
Real state names: `step: "idle" | "generating" | "ready"`, `airport: Airport | null`, `duration` (240), `vibe: VibeId` ("explorer"), `demoMode`, `plan: Plan | null`, `source` ("ai"|"demo"), `done: Record<number, boolean>`, `missionIds`, `wall`, `nickname` (localStorage `layover-nickname`, e.g. `TRAVELER-XXXX`).
`generate()` sends exactly:

```
POST /api/ai/plan
{ iata: airport.iata, city: airport.city, country: airport.country,
  durationMin: duration, vibe, forceDemo: demoMode }
```

On `{ ok, plan, source }` → `setPlan` → `setStep("ready")` → `saveTrip(plan, source)` fire-and-forget (doc 06). The vibe reaches the AI via `userPrompt()`: `VIBES.find(v => v.id === vibe)?.hint ?? vibe`. Cache key of `/api/ai/plan` is `iata:durationMin:vibe`, so vibe is part of the 10-min cache identity.

## Reference
| Contract | Value |
|---|---|
| `GET /api/airports` | `?q=` string, `?limit=` (default 8, max 20) → `{ ok, results: Airport[] }` |
| Slider | min 60 · max 720 · step 15 (minutes) · presets `[60,120,180,300,480]` |
| Vibes | `chill` `foodie` `explorer` `weird` `maxout` |
| Board props | `rows: BoardRow[]`, `cycleMs = 7000`; text props `staggerMs` (board: 18 code / 14 dest) |
| Tones | `amber` (default) `#F5A623` · `green` `#5fbf85` · `red` `#e5484d` |

## Extend tonight (recipes)
1. **Add an airport** (e.g. fix Port Blair to its real code IXZ): open `src/lib/airports.ts`, append one object in the right region block: `{ iata: "IXZ", city: "Port Blair", name: "Veer Savarkar International", country: "India", region: "india" }`. Keep `iata` **exactly 3 chars** — `/api/trips` validates `z.string().length(3)` and silently refuses to archive 4-char codes. Nothing else to touch: combobox + API route pick it up automatically.
2. **Add a 6th vibe**: add `{ id: "luxury", label: "Luxury", hint: "lounges and champagne" }` to `VIBES` in `src/lib/plan-schema.ts`, then add an icon to `VIBE_ICONS` in `vibe-picker.tsx` (e.g. `luxury: Gem`) or the chip crashes on render. No API edit needed (`planSchema.vibe` is `z.string().min(1)`, and `userPrompt()` falls back to the raw id) — but the `hint` in `VIBES` is what actually steers the AI.
3. **Change slider range** (e.g. 30-min sprints): edit `min/max/step` in `duration-slider.tsx` **and** keep `planSchema.totalDurationMin` (60–720) in sync or the plan POST 400s. Update `PRESETS` to match.
4. **Rewrite the board for the final demo narrative**: edit `BOARD_ROWS` in `src/app/page.tsx` — not the component. Judge-night idea: `{ code: "LY-201", dest: "JUDGES' LAYOVERS", info: "FILE YOURS BELOW", status: "BOARDING", tone: "green" }`. Keep `dest` ≤ 16 chars.

## Troubleshooting (symptom → cause → fix)
| Symptom | Cause | Fix |
|---|---|---|
| Airport in `curl /api/airports` results but missing in combobox | Combobox uses the **bundled** dataset, not the API | Edit `AIRPORTS` in `src/lib/airports.ts` |
| "NO SUCH DESTINATION" for a real city | Only 74 curated airports; scoring matches iata/city/country/name | Try the IATA code, or add the airport (recipe 1) |
| Judge wants 5h 20m, slider jumps 5h 15m → 5h 30m | `step={15}` | Set `step={5}` in duration-slider.tsx |
| New vibe chip crashes page | No icon in `VIBE_ICONS` | Add the icon mapping (recipe 2) |
| New vibe selected but AI output unchanged | Vibe id not in `VIBES`, so the prompt gets no hint | Add id+hint to `VIBES` in plan-schema.ts |
| Slider accepts values the plan POST rejects (400) | `planSchema.totalDurationMin` still 60–720 | Sync zod limits in plan-schema.ts (recipe 3) |
| Board rows won't change | Editing the component, or a local array never passed as `rows` | Edit `BOARD_ROWS` in `src/app/page.tsx` (only call site) |
| Port Blair plan never reaches the wall | Dataset stores `iata: "IXC2"` (4 chars) → `POST /api/trips` fails `length(3)`; `saveTrip` fails silently | Rename to `IXZ` in `src/lib/airports.ts` |

## Verify it works
```bash
# dataset via API (dev server on :3000)
curl -s "localhost:3000/api/airports?q=koz"
# → {"ok":true,"results":[{"iata":"CCJ","city":"Kozhikode",...}]}   ✅ verified 2026-10-10
curl -s "localhost:3000/api/airports?q=dxb&limit=3"
```
Click-path: type `koz` → CCJ row appears → ↓ highlight → Enter → placeholder shows "CCJ · Kozhikode" + IATA chip → drag slider in 15-min steps, presets mirror value → pick "Weird" → REQUEST ADVENTURE. Hero board re-flaps every ~7 s.
