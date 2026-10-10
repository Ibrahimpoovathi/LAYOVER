import { NextResponse } from "next/server";
import { costSnapshot } from "@/lib/cost-guard";

export const runtime = "nodejs";

/**
 * GET /api/cost — the COST GUARD readout.
 *
 * { budget, liveThisHour, byKind, remaining, cacheHits, showcaseServes,
 *   savedCalls, tierState, showcaseLock, windowResetsInMin }
 *
 * Powers the footer chip and gives the team a one-look answer to
 * "what is this costing right now?" — live calls vs the hard hourly
 * ceiling, and how many calls caching/showcase saved.
 */
export async function GET() {
  return NextResponse.json({ ok: true, cost: costSnapshot() });
}
