import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planSchema } from "@/lib/plan-schema";

export const runtime = "nodejs";

/**
 * POST /api/trips — archive a completed adventure (traveler + trip + missions).
 * Body: { nickname?, travelerId?, plan }
 *   travelerId = logged-in crew (CREW GATE) — badges accrue to that account.
 *   No travelerId → falls back to upsert-by-nickname (anonymous wanderer).
 * GET  /api/trips?limit=12 — the "wall of adventures" (recent trips + counts)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = planSchema.safeParse(body.plan);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "plan failed validation", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const plan = parsed.data;
    const nickname = (body.nickname ?? "anonymous-traveler").toString().slice(0, 40);

    // CREW GATE: a logged-in crew id wins; otherwise resolve by nickname.
    let travelerId: string | null = null;
    const rawCrewId = (body.travelerId ?? "").toString();
    if (rawCrewId) {
      const crew = await db.traveler.findUnique({ where: { id: rawCrewId }, select: { id: true } });
      if (crew) travelerId = crew.id;
    }
    const traveler = travelerId
      ? { id: travelerId }
      : await db.traveler.upsert({
          where: { nickname },
          update: {},
          create: { nickname },
        });

    const trip = await db.trip.create({
      data: {
        travelerId: traveler.id,
        iata: plan.airport.iata,
        city: plan.airport.city,
        country: plan.airport.country ?? "",
        mode: plan.mode === "road" ? "road" : "air",
        vehicle: plan.vehicle ?? null,
        destination: plan.destination?.city ?? null,
        routeCode: plan.routeCode ?? null,
        durationMin: plan.totalDurationMin,
        vibe: plan.vibe,
        adventureTitle: plan.adventureTitle,
        funFact: plan.funFact,
        bufferMin: plan.bufferMin,
        source: body.source === "demo" ? "demo" : "ai",
        accessProfile: plan.accessProfile ?? "none",
        missions: {
          create: plan.missions.map((m, i) => ({
            order: i,
            title: m.title,
            description: m.description,
            durationMin: m.durationMin,
            category: m.category,
            location: m.location,
            tip: m.tip ?? null,
            distanceM: m.distanceM ?? null,
            stepFree: m.stepFree ?? null,
            sensory: m.sensory ?? null,
          })),
        },
      },
      include: { missions: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ ok: true, trip });
  } catch (err) {
    console.error("[trips/POST]", err);
    return NextResponse.json({ ok: false, error: "Could not archive trip" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 12, 50);
    const trips = await db.trip.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        missions: { select: { done: true } },
        stamps: true,
        traveler: { select: { nickname: true } },
      },
    });
    return NextResponse.json({
      ok: true,
      trips: trips.map((t) => ({
        id: t.id,
        iata: t.iata,
        city: t.city,
        adventureTitle: t.adventureTitle,
        vibe: t.vibe,
        mode: t.mode,
        vehicle: t.vehicle,
        destination: t.destination,
        routeCode: t.routeCode,
        accessProfile: t.accessProfile,
        source: t.source,
        createdAt: t.createdAt,
        nickname: t.traveler?.nickname ?? null,
        missionsTotal: t.missions.length,
        missionsDone: t.missions.filter((m) => m.done).length,
        stampCount: t.stamps.length,
      })),
    });
  } catch (err) {
    console.error("[trips/GET]", err);
    return NextResponse.json({ ok: false, error: "Could not load wall" }, { status: 500 });
  }
}
