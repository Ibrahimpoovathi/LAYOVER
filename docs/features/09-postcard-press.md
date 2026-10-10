# 09 · The Postcard Press

> **Status:** ✅ Live (v3.2 — async press jobs)
> **Route:** `/api/ai/postcard` (POST = start job, GET = poll job)
> **UI:** postcard area under the boarding pass / bus ticket in `src/app/page.tsx`
> **Model:** z-ai-web-dev-sdk `zai.images.generations.create`, size `1344x768` (landscape)

---

## What it is

One click on **POSTCARD** (next to ANNOUNCE above the pass) commissions a vintage
travel-poster illustration of the adventure, rendered as a tilted paper postcard:

| World | Scene prompt | Caption |
| --- | --- | --- |
| WINGS (air) | airport terminal silhouette, departing plane, amber/cream sky | `GREETINGS FROM {CITY} — WISH YOU WERE HERE` |
| WHEELS · bus | red-and-cream inter-state bus on a green ghat road, palms, chai stall | `GREETINGS FROM THE {routeCode} — WISH YOU WERE ON BOARD` |
| WHEELS · train | classic Indian passenger train on a backwater bridge, chai steam | same road caption |

Extras baked into every prompt: retro screen-print style, bold flat shapes,
"no text / no letters / no watermark" (the model still sometimes hand-letters the
city name — honestly it looks like a real press print, we keep it), and a
**vibe-flavor** foreground line so FOODIE trips get steaming street-food stalls,
EXPLORER gets viewpoints, WEIRD gets an odd roadside landmark, etc.

**WHEELS postcards are sent from the destination:** in road mode the plan's stop
is the *origin* (KBS Kozhikode), so `makePostcard` submits
`plan.destination.city` (Bengaluru) instead — the poster depicts where the bus
is headed. Alt text and the download filename follow the same rule.

---

## v3.2 — Why the press jammed, and the async rebuild

### The bug (demo-day near-death)

Original design: the POST request awaited image generation (~25–60 s) and
returned the base64 image in the response body.

Observation from the field (user report): loading state
`THE PRESS IS INKING…` → then `PRESS JAMMED — POSTCARD PENDING`.
Meanwhile dev.log showed **every** postcard POST returning 200, and **zero**
`[ai/postcard]` error lines (the catch path always logs — proven because
`[ai/plan]` fallback lines do land in the same log).

Diagnosis: the server always finished its work, but an intermediary proxy in the
preview chain severs HTTP responses slower than ~30 s. The ~25 s presses got
through; the 47 s / 61 s / 72 s presses died client-side while the server
happily wrote a 140 KB JSON body to a dead socket. Direct `curl localhost:3000`
succeeded every time, which confirmed the cut was between browser and Next.

### The fix — nothing lives longer than one short request

**API rebuilt as an in-memory job queue:**

```
POST /api/ai/postcard  { city, country?, vibe, mode?, vehicle? }
  → { ok: true, id, status: "inking" }        ← returns in <100 ms
  (press runs in background, never awaited)

GET /api/ai/postcard?id=<job>
  → { ok: true, status: "inking" | "done" | "jammed", imageDataUrl?, note? }
  ← every poll answers in ~5–15 ms
```

* `runPress()` runs fire-and-forget with an overall 110 s deadline and **one
  automatic retry** (SDK image calls are occasionally flaky / empty-payload).
* Jobs live in a module-level `Map`, pruned after 15 min (`JOB_TTL_MS`).
* Unknown/expired id → `404 {ok:false}` → client treats it as a jam.

**Client (`makePostcard`) rebuilt as a poll loop:** POST → poll every 2.5 s up to
150 s → `done` → show image · `jammed`/deadline → jam state · 4 consecutive
poll errors → jam state.

### UX hardening (the dead end is gone)

The jam state used to be a full stop. Now it offers:

* **`RUN THE PRESS AGAIN`** button (paper-styled, same `makePostcard`).
* Loading state gained a patience line: `INK DRIES IN ~1 MIN — HANG TIGHT`
  so nobody panic-clicks NEW mid-press.

---

## Verification (2026-10-11, agent-browser on `localhost:3000`, demo lock ON)

| Check | Result |
| --- | --- |
| POST returns instantly | ✅ 0.066 s (was 25–61 s) |
| GET polls | ✅ 5–19 ms each, dev.log shows per-attempt press logs |
| WINGS DXB postcard in browser | ✅ amber terminal + plane scene, SAVE link, `shots/35` |
| WHEELS KBS→MJS bus postcard in browser | ✅ ghat-road bus poster, `GREETINGS FROM THE NH-766 · VIA WAYANAD GHAT — WISH YOU WERE ON BOARD`, `shots/36` |
| Slow press survival (72 s) | ✅ image still arrived — impossible under the old design |
| WHEELS airport chrome | ✅ none — bus/train scenes, road captions |
| Lint | ✅ clean |

## Operator notes

* Presses take **25–90 s** depending on model load; the poll window is 150 s.
  Under heavy load a press can still jam — that's what the retry button is for.
* Jobs are in-memory: a dev-server restart or route-file hot-reload wipes them.
  In-flight presses then fail their polls into the jam state — just press again.
* The base64 image lives in the JSON job (~200 KB each); the 15-min TTL keeps
  memory bounded even on a busy demo night.

## v5 — NO WRONG CITY (landmark scene registry) · 2026-10-10

* User-reported blunder class: a Cochin postcard printing under Calicut.
  Root cause: generic prompts ("airport terminal silhouette") let the image
  model paint any city — or a borrowed landmark.
* Fix: `src/lib/landmarks.ts` — `STOP_SCENES` gives every bundled stop
  (airports + road stops) its own vivid scene descriptor; `buildPrompt`
  presses THAT scene and adds the guard line "must depict <city> … do not
  borrow other cities' landmarks". Unknown stops get a city-anchored
  generic scene that names NO landmark (generic is safe; wrong is not).
* Gallery key now includes `iata` (two Tokyo airports press separately).
* Client sends the stop code: air → `plan.airport.iata`, road →
  `plan.destination.code`; `makePostcard` in `page.tsx`.
* SVG fallback (showcase tier) stamps every card with
  "GREETINGS FROM <CITY>" in a vintage ink plate — a fallback card can be
  generic, never from the wrong city.
* VLM verification loop caught a real scene bug: CCJ originally described
  Chinese fishing nets (iconic to KOCHI, 180 km south — the exact blunder
  class). Fixed to the Kozhikode lighthouse + stone pier + Beypore uru dhow.
* Verify: press CCJ → the card must show Calicut Beach (pier, banded
  lighthouse, palms, dhow) — never Kochi nets; dev.log line
  `[ai/postcard] <id>: press started for CCJ`.
