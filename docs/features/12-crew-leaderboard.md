# 12. Crew Leaderboard — login + badges + two boards

> Status: ✅ · Last verified: 2026-10-10 · Owner: Z.ai Code (main)

## TL;DR
The gamification loop: **log in at the CREW GATE** (callsign + 4-digit PIN),
generate a trip, stamp missions → each stamp is a **BADGE** that banks to
your callsign. Two dark-machine boards under the wall rank **PEOPLE**:
**OVERALL LEADERBOARD** (crew by total badges) and **STOP LEADERBOARD**
(pick a stop chip — airport gate, railway station or bus stand — and see
that stop's crew ranked by badges earned there), with your own row lamp-lit.
Stops are never ranked — people are, per place they've played.

## Why it exists (rubric tie)
- **Built 20**: real auth flow (hashed PINs, anti-troll ownership), real
  aggregation API, real DB round-trip — not a fake scoreboard.
- **Creativity 10**: identity flavored as airport crew codes; the metric is
  the passport stamp the product already mints, so gamification is earned,
  not bolted on.
- **Demo 5**: judge logs in (15s), generates (demo mode, instant), stamps
  one mission → toast + header count + both boards move. A 40-second loop
  with three visible feedback moments.

## Files
| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | `Traveler.pinHash` (sha256 of the 4-digit crew PIN, null = unclaimed) |
| `src/app/api/auth/login/route.ts` | POST login/claim (`{nickname, pin}`), GET session restore (`?id=`); PIN matched/claimed server-side |
| `src/app/api/leaderboard/route.ts` | GET → `{overall[], locations[]}`; full read + in-memory rollup (hackathon scale); `locations[].crew` = people ranked by badges earned at that stop |
| `src/app/api/trips/route.ts` | POST accepts `travelerId` — logged-in crew wins over nickname upsert; GET serves `nickname` for wall cards |
| `src/app/api/missions/[id]/route.ts` | unchanged — mints/deletes the Stamp (= badge) on toggle |
| `src/components/terminal/crew-login.tsx` | `CrewChip` (header) + CREW GATE dialog; fetches own badge count on `refreshKey` bumps |
| `src/components/terminal/leaderboard.tsx` | both boards; stop chips (role=tablist) on the STOP board; `.board-shell` machine scope; polls every 25 s; `YOU` highlight; follows the crew to their strongest stop after each badge |
| `src/app/page.tsx` | crew session state (localStorage `layover-crew`), `boardTick` refresh signal, badge toast, section wiring |

## How it works
1. **Claim**: `POST /api/auth/login {nickname, pin}` — new callsign → PIN
   claims it; unclaimed legacy nickname → PIN claims it; claimed + mismatch
   → `401 "Callsign taken — that crew PIN doesn't match"`. PINs stored as
   `sha256("layover-crew:" + pin)` — never plaintext.
2. **Bank**: trips POST with `travelerId` → stamps minted on mission toggle
   count as that traveler's badges. No `travelerId` → old nickname-upsert
   path (anonymous wanderers still get a row).
3. **Move the boards**: page keeps `boardTick`; bumped on login, on trip
   save, and when a stamp response arrives → passed as `refreshKey` to both
   `CrewChip` and `Leaderboard` → immediate refetch. Boards also poll 25 s
   so the hall sees each other's badges live.
4. **Honest identity**: `GET /api/auth/login?id=` re-derives
   `{trips, badges}` from DB — the header chip never invents a count.

## Reference
Login request/response:

```jsonc
POST /api/auth/login  { "nickname": "CAPTAIN-CHAI", "pin": "4242" }
// → { ok: true, traveler: { id, nickname, trips, badges } }
GET  /api/leaderboard
// → { ok, overall: [{nickname, trips, badges}],
//     locations: [{ code, city, mode, vehicle, badges, crewCount,
//                   crew: [{nickname, trips, badges}] }] }  // people ranked per stop
```

Board row contract: `RankMark` gives ranks 1–3 a filled `✦` lamp; rows
whose `nickname === crewNickname` get the amber `YOU` chip. Stop chips are
`role=tab` buttons (code + mode icon + badge count); selection is sticky
across polls unless the stop disappears. On load and after every badge
(`refreshKey` bump) the STOP board auto-follows the logged-in crew to the
stop where they hold the most badges.

## Extend tonight (recipes)
1. **New badge flavor** (e.g. double stamp for DEAF trips): edit
   `/api/missions/[id]` — create a second stamp or set `ink` special.
2. **Bigger boards**: `MAX_ROWS` in `api/leaderboard/route.ts`.
3. **Prune noise**: leaderboard filters `trips > 0`; anonymous junk rows can
   be removed by deleting the Traveler row (stamps cascade via trip).

## Troubleshooting (symptom → cause → fix)
| Symptom | Cause | Fix |
|---|---|---|
| Chip shows `… ✦` forever | `/api/auth/login?id=` 404 (stale localStorage id after db reset) | LOGOUT → login again |
| Login always "PIN doesn't match" | the callsign was claimed by someone else earlier | pick another callsign |
| Boards don't refresh after stamping | `boardTick` bump skipped (mission PATCH failed) | check dev.log for `[missions/PATCH]` |
| `canSpend("transcribe")` returns false + cost JSON shows `null` | stale globalThis cost state from an old module run (6th Turbopack staleness incident) | clean restart: `pkill -f "next dev"; rm -rf .next; bun run dev` |

## Verify it works
```bash
# wrong PIN is refused
curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"nickname":"CAPTAIN-CHAI","pin":"9999"}'
# → {"ok":false,"error":"Callsign taken — that crew PIN doesn't match"}
curl -s localhost:3000/api/leaderboard | head -c 300
```
Browser: CREW LOGIN → callsign + PIN → BOARD AS CREW → chip `NAME · N ✦` →
DEMO MODE → generate → stamp a mission → `BADGE EARNED` toast → header
count +1 → both boards move, your row glows with `YOU`, and the STOP board
jumps to the gate you just played (your callsign ranked against everyone
else who played there). Switch stop chips to see other gates' crews.
