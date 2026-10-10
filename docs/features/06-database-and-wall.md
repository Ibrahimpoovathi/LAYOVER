# 06. Database & wall of adventures

> Status: ✅ · Last verified: 2026-10-10 · Owner: base toolkit (Task 1)

## TL;DR
Prisma + SQLite (`DATABASE_URL=file:/home/z/my-project/db/custom.db`). Relation chain Traveler → Trip → Mission → Stamp. Every successful plan generation is archived by `POST /api/trips` (fire-and-forget from `page.tsx`); the wall section reads `GET /api/trips`. Completing a mission mints a Stamp (unique per mission, ink from `CATEGORY_META`); un-toggling deletes it.

## Why it exists (rubric tie)
- **Built (20)**: real persistence — trips, missions and stamps survive refresh and restarts; counts (`missionsDone`, `stampCount`) are computed server-side from relations, not client state.
- **Demo (5)**: "every adventure filed tonight lives here" — the wall grows live during Round 1 as judges use the booth laptop. Free storytelling.

## Files
| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | Traveler / Trip / Mission / Stamp models, SQLite datasource |
| `src/lib/db.ts` | PrismaClient singleton exported as `db` |
| `src/app/api/trips/route.ts` | `POST` archive trip · `GET` wall feed |
| `src/app/api/missions/[id]/route.ts` | `PATCH` toggle done → mint/delete stamp |
| `src/app/api/route.ts` | scaffold health check: `GET /` → `{ message: "Hello, world!" }` |
| `src/app/page.tsx` | `saveTrip()`, `loadWall()`, `toggleMission()` |

## How it works

### Models (`prisma/schema.prisma`, real fields)
- **Traveler** — `id` (cuid), `nickname String @unique`, `trips Trip[]`, `createdAt`.
- **Trip** — `id`, `travelerId? → Traveler (onDelete: SetNull)`, `iata`, `city`, `country`, `durationMin Int`, `vibe`, `adventureTitle`, `funFact?`, `bufferMin Int @default(60)`, `source String @default("ai")` (`"ai" | "demo"`), `createdAt`, back-relations `missions` + `stamps`; `@@index([createdAt])`, `@@index([iata])`.
- **Mission** — `id`, `tripId → Trip (onDelete: Cascade)`, `order Int`, `title`, `description`, `durationMin Int`, `category String` (eat | explore | chill | move | weird | rest), `location`, `tip?`, `done Boolean @default(false)`, back-relation `stamp?`; `@@index([tripId])`.
- **Stamp** — `id`, `tripId → Trip (onDelete: Cascade)`, `missionId String? @unique → Mission (onDelete: SetNull)`, `category`, `ink String @default("#c2452d")`, `earnedAt`; `@@index([tripId])`.

```
Traveler 1─n Trip 1─n Mission 1─0..1 Stamp
                └──────1─n──────┘   (Stamp.tripId duplicated for per-trip counts)
```
**Stamp semantics**: max one stamp per mission (`missionId @unique`). Minted by the PATCH route when a mission flips to `done=true` (ink = `CATEGORY_META[category].ink`, unknown categories fall back to `chill`'s brown). Un-toggling deletes the row — stamps are recomputed, never "stuck". Deleting a Mission nulls `stamp.missionId` (stamp survives, orphan); deleting a Trip cascades to missions AND stamps; deleting a Traveler only nulls `Trip.travelerId`.

### `db.ts` singleton
`db = globalForPrisma.prisma ?? new PrismaClient({ log: ["query"] })`, cached on `globalThis` outside production — prevents hot-reload from spawning a new client per module eval. Import everywhere as `import { db } from "@/lib/db"`. Note `log: ["query"]` — every query prints in the dev server console (handy for 4 AM debugging).

### `POST /api/trips` — archive
Body `{ nickname?, plan, source? }`:
1. `planSchema.safeParse(body.plan)` → failure = **400** `{ ok: false, error: "plan failed validation", details: <zod flatten> }`.
2. `nickname = (body.nickname ?? "anonymous-traveler").toString().slice(0, 40)` → `db.traveler.upsert({ where: { nickname }, update: {}, create: { nickname } })`.
3. `db.trip.create` with **nested mission create** (`plan.missions.map((m, i) => ({ order: i, title, description, durationMin, category, location, tip: m.tip ?? null }))`), `source: body.source === "demo" ? "demo" : "ai"`, `include: { missions: { orderBy: { order: "asc" } } }`.
4. Response **200** `{ ok: true, trip }` — `trip.missions[].id` is what the client stores in `missionIds` for later PATCH toggles. Any throw → **500** `{ ok: false, error: "Could not archive trip" }` (logged as `[trips/POST]`).

### `GET /api/trips` — the wall
`?limit=` default **12**, clamped ≤ **50**. `db.trip.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: { missions: { select: { done: true } }, stamps: true } })`, each trip mapped to:
`{ id, iata, city, adventureTitle, vibe, source, createdAt, missionsTotal, missionsDone, stampCount }` — the last three are **computed** (`missions.filter(m => m.done).length`, `stamps.length`). Response `{ ok, trips }`. Errors → 500 `"Could not load wall"`.

### `PATCH /api/missions/[id]` — toggle + mint
Body `{ done: boolean }`. Mission lookup (`include: { stamp: true }`) → **404** if missing. `db.mission.update({ data: { done } })`, then:
- `done && !stamp` → `db.stamp.create({ tripId, missionId, category, ink: CATEGORY_META[mission.category]?.ink ?? CATEGORY_META.chill.ink })`
- `!done && stamp` → `db.stamp.delete`, `stamp = null`

Response `{ ok: true, mission, stamp }`. Category not in `CATEGORY_META` still mints — it just inherits chill ink, so "stamp not minting" is never a category problem (see Troubleshooting).

### `page.tsx` flow (real triggers)
- **When is POST /api/trips called?** `saveTrip(plan, source)` is fired at the end of a **successful `generate()`** — immediately after `/api/ai/plan` returns `{ ok, plan, source }`, before the pass even renders (fire-and-forget, not awaited). Both live-AI and the server demo fallback archive (`source` passed through). The pure client-side crash fallback (`genericDemoPlan` inside the `catch`) does **NOT** archive.
- `saveTrip` keeps `data.trip.missions` ids in `missionIds`, then calls `loadWall()` → `GET /api/trips?limit=10` → `setWall`. `loadWall` also runs once on mount. All its errors are swallowed ("wall is decorative").
- **Mission toggle**: `toggleMission(i)` optimistically flips `done[i]`, then `PATCH /api/missions/${missionIds[i]}` with `{ done }` (errors swallowed). The visible stamp comes from the `done` map via `BoardingPassCard`; the DB Stamp row is the persistent artifact that `stampCount` on the wall counts.

## Reference
Zod limits (`planSchema` in `src/lib/plan-schema.ts`) — the exact contract a POST payload must satisfy:

| Field | Limit |
|---|---|
| `adventureTitle` | 3–90 chars |
| `airport.iata` | exactly 3 chars |
| `airport.city` / `airport.country?` | min 1 |
| `vibe` | any non-empty string (not enum-validated) |
| `totalDurationMin` | int 60–720 |
| `bufferMin` | int 30–180 |
| `funFact` | 10–220 chars |
| `missions` | array of 2–6 |
| `mission.title` / `mission.description` | 2–80 / 10–280 chars |
| `mission.durationMin` | int 15–300 |
| `mission.category` | enum `eat·explore·chill·move·weird·rest` |
| `mission.location` / `mission.tip?` | 2–120 / ≤160 chars |

| Endpoint | Contract |
|---|---|
| `POST /api/trips` | `{ nickname?, plan, source? }` → `{ ok, trip }` |
| `GET /api/trips` | `?limit=` (12, max 50) → `{ ok, trips[] }` |
| `PATCH /api/missions/[id]` | `{ done }` → `{ ok, mission, stamp }` |
| `GET /api` | health: `{ message: "Hello, world!" }` |

## Extend tonight (recipes)
1. **Passport view** (all trips of one traveler): in `GET /api/trips` accept `?nickname=`: `db.traveler.findUnique({ where: { nickname }, include: { trips: { orderBy: { createdAt: "desc" }, include: { stamps: true } } } })` (404 if null). `page.tsx` already has `nickname` in state (localStorage `layover-nickname`) — pass it as a query param from a new "MY PASSPORT" button.
2. **"Total stamps earned" counter**: one line in `GET /api/trips`: `const stampTotal = await db.stamp.count()` → return alongside `trips`; render next to `{wall.length} LOGGED` in the wall header. Uses the existing `@@index([tripId])`-free full scan, trivial at tonight's scale.
3. **Seed the wall before doors open**: create `prisma/seed.ts` importing `@prisma/client` directly; loop over a few `planSchema`-valid payloads (shape = the Verify payload below), for each: traveler upsert by nickname (e.g. `seed-ccj`, `seed-dxb`) + `trip.create` with nested `missions.create`. Run with `bunx tsx prisma/seed.ts`. Reusing valid payloads keeps seeds indistinguishable from real trips.
4. **Reset the DB safely**: `bun run db:push` (= `prisma db push --accept-data-loss`) re-syncs schema to `db/custom.db` and **destroys rows on changed models** — tonight's judge trips vanish. If you must: run it BEFORE doors open, then re-seed (recipe 3). One dev server only, and never while a request is mid-write.
5. **Add a field to Trip** (e.g. `rating Int?`): 1) edit `prisma/schema.prisma` 2) `bun run db:push` (nullable column = no data loss) 3) add to the create data in `POST /api/trips` 4) add to the GET mapping + `WallTrip` interface in `page.tsx`. Prisma client types refresh with push/generate.

## Troubleshooting (symptom → cause → fix)
| Symptom | Cause | Fix |
|---|---|---|
| API 500: `The table \`main.Trip\` does not exist` | Schema edited but never pushed | `bun run db:push` (then `bun run db:generate` if types are stale) |
| `PrismaClientInitializationError` re `DATABASE_URL` | `.env` missing/wrong — must be `DATABASE_URL=file:/home/z/my-project/db/custom.db` | Restore the `.env` line; ensure the `db/` dir exists |
| Stamp never mints on completion | Trip was never archived → `missionIds[i]` undefined → PATCH never fires (e.g. the client-side `genericDemoPlan` fallback path skips `saveTrip`, or POST returned 400/500 silently) | Confirm `POST /api/trips` returns `ok:true` + mission ids (Verify below); NOT a `CATEGORY_META` issue — unknown categories still mint with chill ink |
| Mission PATCH returns 404 | Stale `missionIds` after `reset()`/regenerate | Toggle only missions of the current pass; `reset()` already clears `missionIds` |
| Wall empty after a trip POST | POST returned 400 (`plan failed validation`) or 500; `saveTrip` swallows all errors | Re-run the POST via curl and read `details`; fix the field out of zod range (Reference table) |
| `SQLite database is locked` / disk I/O error | Two `next dev` processes or db:push racing a live write on `custom.db` | Kill extra dev servers; retry when idle; worst case `db:push` + re-seed |
| Old trips vanish after a schema change | `db:push --accept-data-loss` recreated tables | Expected — re-seed (recipe 3); run resets only before doors |
| Wall capped at 12 entries | `GET /api/trips` default `limit=12` | Request `?limit=50` |

## Verify it works
Payload below is **real and `planSchema`-valid** (validated against the actual zod schema; full POST→GET→PATCH cycle executed on 2026-10-10, test row cleaned up after).

```bash
# 1) archive a trip (2 missions, all required fields, within zod limits)
curl -s -X POST localhost:3000/api/trips -H 'Content-Type: application/json' -d '{
  "nickname": "doc-tester", "source": "demo",
  "plan": {
    "adventureTitle": "Four Hours in Dubai, Maxed",
    "airport": { "iata": "DXB", "city": "Dubai", "country": "UAE" },
    "vibe": "explorer", "totalDurationMin": 240, "bufferMin": 60,
    "funFact": "DXB is so big it has its own fire station inside the terminal.",
    "missions": [
      { "title": "Karak chai at Gate B7",
        "description": "Order a karak chai and watch the A380s push back in formation from the glass.",
        "durationMin": 45, "category": "eat", "location": "Gate B7, Concourse B",
        "tip": "Pay with a dirham coin for luck" },
      { "title": "Window walk to Concourse A",
        "description": "Ride the underground train and spot superjumbo winglets from the glass wall.",
        "durationMin": 60, "category": "explore", "location": "Concourse A glass wall" }
    ]
  }
}'
# → {"ok":true,"trip":{...,"missions":[{"id":"…","order":0},…]}}   copy a mission id

# 2) see it on the wall
curl -s "localhost:3000/api/trips?limit=3" | jq '.trips[0] | {iata, adventureTitle, missionsTotal, stampCount}'

# 3) complete a mission → mint stamp (verified: ink "#2d7d74", category "explore")
curl -s -X PATCH "localhost:3000/api/missions/<MISSION_ID>" -H 'Content-Type: application/json' \
  -d '{"done":true}' | jq '{done: .mission.done, stamp: .stamp.ink}'
# un-toggle → stamp deleted (verified: stamp null)
curl -s -X PATCH "localhost:3000/api/missions/<MISSION_ID>" -H 'Content-Type: application/json' -d '{"done":false}'

# 4) server alive
curl -s localhost:3000/api
```
Browser: generate any adventure → wall card appears instantly ("N LOGGED" bumps) → tick a mission in the pass → wall card's mission dots fill after `saveTrip`'s `loadWall()` refresh.
