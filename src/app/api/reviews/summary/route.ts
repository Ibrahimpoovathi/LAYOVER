import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * CREW REVIEWS — bulk star summaries for a plan's mission rows.
 *
 * GET /api/reviews/summary?keys=<encodeURIComponent(JSON.stringify(keys))>
 *   keys = missionKey strings (title|location, normalized) computed by the
 *   client via missionKeyOf(). One groupBy query covers every row on the
 *   pass, so a 6-mission plan costs exactly one DB round-trip.
 *
 *   → { ok, summaries: { [key]: { avg: number|null, count: number } } }
 */
export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("keys") ?? "[]";
    let keys: string[] = [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        keys = parsed.filter((k): k is string => typeof k === "string").slice(0, 30);
      }
    } catch {
      return NextResponse.json({ ok: false, error: "keys must be a JSON array" }, { status: 400 });
    }
    if (keys.length === 0) {
      return NextResponse.json({ ok: true, summaries: {} });
    }

    const grouped = await db.review.groupBy({
      by: ["missionKey"],
      where: { missionKey: { in: keys } },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const summaries: Record<string, { avg: number | null; count: number }> = {};
    for (const g of grouped) {
      summaries[g.missionKey] = {
        avg: g._avg.rating != null ? Math.round(g._avg.rating * 10) / 10 : null,
        count: g._count._all,
      };
    }
    return NextResponse.json({ ok: true, summaries });
  } catch (err) {
    console.error("[reviews/summary]", err);
    return NextResponse.json({ ok: false, error: "Review desk jammed" }, { status: 500 });
  }
}
