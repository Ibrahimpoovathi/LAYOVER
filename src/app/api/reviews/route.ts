import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { missionKeyOf } from "@/lib/review-key";

export const runtime = "nodejs";

/**
 * CREW REVIEWS — "is this task worth it?"
 *
 * GET /api/reviews?missionId=<id>      — detail for one task (server resolves the key)
 * GET /api/reviews?key=<encoded>       — detail for one task by key (works even for
 *                                        missions that were never archived to the DB)
 *        + optional &travelerId=<id>   — includes `mine` so the form pre-fills
 *        → { ok, key, avg, count, distribution, reviews: [...], mine? }
 *
 * POST /api/reviews — write/update a review (LOGIN REQUIRED: verified travelerId)
 *   Body: { travelerId, rating (1..5), verdict?, comment?, missionId? , key?/title+location? }
 *   One review per crew per task — posting again updates your existing review.
 *
 * Reading is public (that's the point: "is this costly / worth it?").
 * Writing is crew-only so the board can't be trolled by drive-by rats.
 */

const VERDICTS = new Set(["WORTH_IT", "PRICEY", "SKIP"]);

function emptyDistribution() {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
}

async function resolveKey(missionId: string | null, keyParam: string | null) {
  if (missionId) {
    const mission = await db.mission.findUnique({
      where: { id: missionId },
      select: { title: true, location: true },
    });
    if (mission) return missionKeyOf(mission.title, mission.location);
  }
  return keyParam ? keyParam.slice(0, 200) : null;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const key = await resolveKey(sp.get("missionId"), sp.get("key"));
    if (!key) {
      return NextResponse.json({ ok: false, error: "missionId or key required" }, { status: 400 });
    }

    const reviews = await db.review.findMany({
      where: { missionKey: key },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        nickname: true,
        rating: true,
        verdict: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        travelerId: true,
      },
    });

    const count = reviews.length;
    const avg = count ? reviews.reduce((n, r) => n + r.rating, 0) / count : null;
    const distribution = emptyDistribution();
    for (const r of reviews) {
      if (r.rating >= 1 && r.rating <= 5) distribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
    }

    const travelerId = (sp.get("travelerId") ?? "").toString();
    const mine = travelerId ? reviews.find((r) => r.travelerId === travelerId) ?? null : null;

    return NextResponse.json({
      ok: true,
      key,
      avg,
      count,
      distribution,
      reviews: reviews.map(({ travelerId: _tid, ...r }) => r),
      mine: mine ? { rating: mine.rating, verdict: mine.verdict, comment: mine.comment } : null,
    });
  } catch (err) {
    console.error("[reviews/GET]", err);
    return NextResponse.json({ ok: false, error: "Review desk jammed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: {
      travelerId?: string;
      rating?: number;
      verdict?: string | null;
      comment?: string | null;
      missionId?: string | null;
      key?: string | null;
      title?: string | null;
      location?: string | null;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    // LOGIN REQUIRED — the travelerId must exist (client sends the crew id
    // from its CREW GATE session; same trust model as /api/trips).
    const travelerId = (body.travelerId ?? "").toString();
    if (!travelerId) {
      return NextResponse.json(
        { ok: false, error: "CREW LOGIN NEEDED — claim a callsign to rate missions" },
        { status: 401 },
      );
    }
    const traveler = await db.traveler.findUnique({
      where: { id: travelerId },
      select: { id: true, nickname: true },
    });
    if (!traveler) {
      return NextResponse.json({ ok: false, error: "Unknown crew — log in again" }, { status: 401 });
    }

    const rating = Math.round(Number(body.rating));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: "Rating is 1 to 5 stars" }, { status: 400 });
    }
    const verdict =
      body.verdict && VERDICTS.has(body.verdict) ? body.verdict : null;
    const comment =
      body.comment && String(body.comment).trim() ? String(body.comment).trim().slice(0, 240) : null;

    // Task identity: prefer the mission row (server-side truth), else the
    // client-computed key / explicit title+location (lets replanned or
    // not-yet-archived missions be rated too).
    let key: string | null = null;
    let missionId: string | null = null;
    if (body.missionId) {
      const mission = await db.mission.findUnique({
        where: { id: body.missionId },
        select: { id: true, title: true, location: true },
      });
      if (mission) {
        key = missionKeyOf(mission.title, mission.location);
        missionId = mission.id;
      }
    }
    if (!key) {
      const title = (body.title ?? "").toString();
      const location = (body.location ?? "").toString();
      if (title && location) {
        key = missionKeyOf(title, location);
      } else if (body.key) {
        key = body.key.slice(0, 200);
      }
    }
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "Need missionId, or title+location, or key" },
        { status: 400 },
      );
    }

    const review = await db.review.upsert({
      where: { travelerId_missionKey: { travelerId: traveler.id, missionKey: key } },
      create: {
        missionKey: key,
        missionId,
        travelerId: traveler.id,
        nickname: traveler.nickname,
        rating,
        verdict,
        comment,
      },
      update: { rating, verdict, comment, missionId: missionId ?? undefined },
    });

    const { travelerId: _tid, ...safeReview } = review;
    return NextResponse.json({ ok: true, review: safeReview, updated: true });
  } catch (err) {
    console.error("[reviews/POST]", err);
    return NextResponse.json({ ok: false, error: "Review desk jammed" }, { status: 500 });
  }
}
