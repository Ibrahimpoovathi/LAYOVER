# THE COST PLAYBOOK — answering "what does it cost to run?"

> The organizers' concern: LAYOVER's magic is AI (mission planning, postcard
> pressing, gate announcements) and AI calls cost money per request. If 200
> judges and students hammer the app during demo hour, what's the bill?
>
> LAYOVER's answer is not "trust us, it's cheap." It is an architectural
> guarantee with a live readout in the footer.

## 1. The three-tier cost ladder

Every AI feature in LAYOVER resolves through the same gate
(`src/lib/cost-guard.ts`) before a single paid call is made:

| Tier | Name | What serves the request | Cost |
|------|------|--------------------------|------|
| 1 | **SHOWCASE** | Deterministic local fixtures — the demo locker's hand-written journeys + postcards drawn in code as SVG (`src/lib/postcard-svg.ts`) | ₹0, always |
| 2 | **CACHED** | A previous identical result replayed from memory (plans 24h, postcards 24h, announcements 1h) | ₹0, always |
| 3 | **LIVE** | A real SDK call — LLM plan / image press / TTS voice | counted vs. budget |

Tier 3 is fenced by a **hard rolling-hour budget** (`AI_HOURLY_BUDGET`,
default 60 calls/h). At the ceiling, nothing breaks and nothing errors on
screen: plans keep planning (from the locker), postcards keep printing
(from the local SVG press), announcements stop speaking (the script stays
on the page). The app degrades to zero-spend; it never degrades to broken.

## 2. What each feature actually costs

| Feature | Cold (first click) | Warm (every click after) |
|---------|--------------------|--------------------------|
| Mission plan (LLM) | 1 completion (~2k tokens) | free for 24h — cached by route+vibe+duration |
| Postcard (image) | 1 image generation | free for 24h — cached by city+mode+vibe |
| Announcement (TTS) | 1 speech synthesis | free for 1h — cached by text |

The demo journey makes this brutal to argue with: the demo lock serves the
**same deterministic journey every time** (zero LLM calls), and its
postcard scene is one city — so an entire day of judges re-running the demo
costs **one** image generation. Press two = instant replay. Press fifty =
still one.

## 3. The knobs (all env, all optional)

- `AI_HOURLY_BUDGET=60` — hard cap on live calls per rolling hour.
- `AI_SHOWCASE=1` — the zero-spend switch. Every feature serves Tier 1
  unconditionally. The product stays fully interactive (planning, stamps,
  postcards, both worlds) at a runtime cost of exactly ₹0.
- No database spend: SQLite is a local file. No hosting spend beyond one
  Node process: everything is in-memory, no Redis, no queue, no bucket.

## 4. The live readout

The footer chip is the answer you can point at during Q&A:

```
🛡 COST GUARD · LIVE 2/60 · SAVED 9
```

- **LIVE n/60** — paid calls spent this hour vs. the ceiling
  (dot: green < 80% · amber ≥ 80% · red = capped, all-free mode).
- **SAVED n** — requests answered free by cache or showcase instead of a
  paid call. This number climbs all demo night.

`GET /api/cost` returns the full snapshot (per-feature counts, budget,
seconds-to-window-reset) — show it on your screen while pitching.

## 5. Demo-day script (30 seconds, judge-proof)

1. "AI usually means an open-ended bill. We built the opposite — a ceiling."
2. Point at the footer: LIVE n/60, SAVED n — "that's the whole meter."
3. Run the demo journey twice; the second postcard prints instantly —
   "press fifty times, it stays one generation. That's the 24-hour cache."
4. "And if the room ever gets expensive — one env var, `AI_SHOWCASE=1`,
   and the app runs the rest of the night at exactly ₹0. Postcards included;
   we draw those in code." (Show the SVG postcard — it's on the ticket.)
5. Worst case is known: 60 live calls/hour bounded; typical demo night
   lands under 20, mostly saved by cache.

## 6. Why this wins the cost argument

- **Bounded, not merely cheap** — a hard cap is a different sentence than
  "we'll monitor it."
- **Visible** — the guard is in the footer of the running app, not in a
  spreadsheet.
- **Zero-cost mode is a mode, not a cripple** — showcase postcards are a
  deliberate feature (locally illustrated vintage posters), so the demo
  never looks downgraded.
- **Honest UI** — zero-spend artifacts are labeled (`ZERO-SPEND PRESS`,
  `TRAINING` wall chips, `COST GUARD engaged` toast). No smoke.

## 7. Where it lives in code

- `src/lib/cost-guard.ts` — budget engine + snapshot (one small file).
- `src/lib/postcard-svg.ts` — the local postcard press (3 scenes).
- `src/app/api/cost/route.ts` — the readout endpoint.
- `src/app/api/ai/plan/route.ts` — 24h plan cache + tier gate.
- `src/app/api/ai/postcard/route.ts` — 24h gallery + tier gate.
- `src/app/api/ai/announce/route.ts` — 1h clip cache + tier gate.
- `src/components/terminal/cost-guard-chip.tsx` — the footer meter.
