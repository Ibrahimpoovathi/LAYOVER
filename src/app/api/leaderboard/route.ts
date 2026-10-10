import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * THE LEADERBOARD — PEOPLE ranked by badges, twice over.
 *
 * GET /api/leaderboard →
 *   {
 *     overall:   [{ nickname, trips, badges }] — every crew member ranked by
 *                  TOTAL badges collected.
 *     locations: [{ code, city, mode, vehicle, badges, crewCount,
 *                   crew: [{ nickname, trips, badges }] }] — the SAME people,
 *                  categorized by the stop they earned badges at (airport
 *                  gate, railway station or bus stand) and ranked by badges
 *                  earned THERE. A crew member can appear on several stop
 *                  boards — one per place they've played.
 *   }
 *
 * A BADGE = one stamped mission (minted per completed mission). The overall
 * board answers "who is the crew champion?"; each stop board answers "who
 * owns THIS gate tonight?". Stops themselves are not ranked — people are.
 *
 * Hackathon-scale data: a full read + in-memory rollup is instant and
 * avoids fragile multi-level SQL group-bys.
 */

const MAX_ROWS = 50;
const MAX_STOPS = 12;

interface CrewRow {
  nickname: string;
  trips: number;
  badges: number;
}

interface StopAgg {
  code: string;
  city: string;
  mode: string;
  vehicle: string | null;
  badges: number;
  crew: Map<string, CrewRow>;
}

export async function GET() {
  try {
    const travelers = await db.traveler.findMany({
      select: {
        nickname: true,
        trips: {
          select: {
            iata: true,
            city: true,
            mode: true,
            vehicle: true,
            stamps: { select: { id: true } },
          },
        },
      },
    });

    const overall: CrewRow[] = [];
    const stops = new Map<string, StopAgg>();

    for (const t of travelers) {
      const total = { trips: 0, badges: 0 };
      for (const tr of t.trips) {
        total.trips += 1;
        total.badges += tr.stamps.length;

        const key = tr.iata.toUpperCase();
        const agg = stops.get(key) ?? {
          code: key,
          city: tr.city,
          mode: tr.mode,
          vehicle: tr.vehicle,
          badges: 0,
          crew: new Map<string, CrewRow>(),
        };
        agg.badges += tr.stamps.length;
        const row = agg.crew.get(t.nickname) ?? { nickname: t.nickname, trips: 0, badges: 0 };
        row.trips += 1;
        row.badges += tr.stamps.length;
        agg.crew.set(t.nickname, row);
        stops.set(key, agg);
      }
      if (total.trips > 0) overall.push({ nickname: t.nickname, ...total });
    }

    const rankCrew = (a: CrewRow, b: CrewRow) =>
      b.badges - a.badges || b.trips - a.trips || a.nickname.localeCompare(b.nickname);

    overall.sort(rankCrew);

    const locations = [...stops.values()]
      .map((s) => ({
        code: s.code,
        city: s.city,
        mode: s.mode,
        vehicle: s.vehicle,
        badges: s.badges,
        crewCount: s.crew.size,
        crew: [...s.crew.values()].sort(rankCrew).slice(0, MAX_ROWS),
      }))
      .sort((a, b) => b.badges - a.badges || b.crewCount - a.crewCount || a.code.localeCompare(b.code))
      .slice(0, MAX_STOPS);

    return NextResponse.json({
      ok: true,
      overall: overall.slice(0, MAX_ROWS),
      locations,
    });
  } catch (err) {
    console.error("[leaderboard]", err);
    return NextResponse.json({ ok: false, error: "Could not read the leaderboard" }, { status: 500 });
  }
}
