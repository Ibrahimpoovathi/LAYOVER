# 14 — CREW REVIEWS ("is this task worth it?")

> Every mission row carries a star chip that aggregates what real crew said
> about THAT task — across every trip that ever generated it. Reading is
> public; filing a verdict requires CREW LOGIN. 1 demo line: "The board now
> tells you if the sulaimani is worth sixty rupees."

## The feature

- **Star chip on every mission row** (boarding pass manifest + bus ticket
  stages): `★ 4.5 (7)` when reviewed, `☆ RATE IT` when not. One bulk
  request serves all chips on a plan (single `groupBy` query).
- **Verdict dialog** per task:
  - summary strip — big average, star row, `N CREW VERDICTS`
  - 5→1 distribution bars
  - review list — nickname, stars, verdict chip, field note, file date,
    `YOU` marker on your own review (max-h scroll, latest first)
  - **rate form** (crew only): 1–5 star picker, cost-verdict chips
    (**WORTH IT / PRICEY / SKIP IT**), optional ≤240-char field note.
    Logged out → a gate line pointing at the CREW GATE.
- Posting again **updates** your verdict (one review per crew per task).
- Chip + dialog update live after posting (toast: `VERDICT FILED`).

## The key design decision — reviews follow the TASK, not the trip

A task is identified by `missionKey = normalize(title) + "|" +
normalize(location)` (`src/lib/review-key.ts`, shared client + server).
The same "Sulaimani tea ceremony @ Departures canteen counter" generated
for ten different travelers maps to ONE review bucket, so the average
reflects everyone's experience. This also works for replanned /
not-yet-archived missions: the POST accepts `title`+`location` (or a
client key) when no DB mission id exists — `missionId` is stored as
back-reference when available.

## API

| Route | Behavior |
|---|---|
| `GET /api/reviews/summary?keys=<json array>` | bulk `{ [key]: { avg, count } }` — one `groupBy` for a whole plan |
| `GET /api/reviews?missionId= \| key=&travelerId=` | detail: avg, count, distribution, latest 50 reviews, `mine` for pre-fill |
| `POST /api/reviews` | **login required** (verified `travelerId`, same trust model as `/api/trips`); rating 1..5, verdict enum, comment ≤240; upsert on `@@unique([travelerId, missionKey])` |

401 body is a human line: `CREW LOGIN NEEDED — claim a callsign to rate
missions`. Trolled ratings are bounded by the same callsign+PIN gate that
protects the leaderboard.

## Data model

```prisma
model Review {
  id, missionKey, missionId?, travelerId → Traveler (Cascade),
  nickname (denormalized), rating Int, verdict String?  // WORTH_IT|PRICEY|SKIP
  comment String?, createdAt, updatedAt
  @@unique([travelerId, missionKey])
  @@index([missionKey])
}
```

## Seeded demo data

`bun prisma/seed-reviews.ts` (idempotent, runs against :3000) — logs in 8
fictional crew callsigns through the real `/api/auth/login`, then files
~200 verdicts across **all 46 demo tasks** (DXB/SIN/CCJ air plans, road +
wheels journeys, generic pools) via the real `POST /api/reviews`. Ratings
lean 3–5★ with honest 2★/PRICEY/SKIP notes so boards look lived-in.
Demo E2E therefore shows real averages instantly, no AI needed.

## Files

- `prisma/schema.prisma` (Review model), `prisma/seed-reviews.ts` (new)
- `src/lib/review-key.ts` (new — the shared task key)
- `src/app/api/reviews/route.ts`, `src/app/api/reviews/summary/route.ts` (new)
- `src/components/terminal/mission-reviews.tsx` (new — chip + dialog + hook)
- `mission-timeline.tsx`, `bus-ticket-card.tsx`, `boarding-pass-card.tsx`,
  `page.tsx` (crew + missionIds threading, chip render)

## Verification

- tsc + lint clean; seeded API sanity via curl (exact key match).
- Browser E2E: CCJ demo pass chips `3.5 (6) · 4.5 (6) · 4.0 (6) · 3.4 (5)`;
  dialog shows distribution + reviews while logged out (gate line);
  logged in as VERDICT-VOYAGER → 4★ WORTH IT + note → toast, list shows
  `YOU`, chip recomputes to `3.6 (7)` live; road ticket 5 stages all
  chips populated; light + night themes; zero console/page errors;
  shots 112–116.
