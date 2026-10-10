import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORY_META, type MissionCategory } from "@/lib/plan-schema";

export const runtime = "nodejs";

/**
 * PATCH /api/missions/[id]  { done: boolean }
 * Toggles a mission; when completed, mints a passport stamp for it.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const done = Boolean(body.done);

    const mission = await db.mission.findUnique({ where: { id }, include: { stamp: true } });
    if (!mission) {
      return NextResponse.json({ ok: false, error: "Mission not found" }, { status: 404 });
    }

    const updated = await db.mission.update({
      where: { id },
      data: { done },
    });

    let stamp = mission.stamp;
    if (done && !stamp) {
      const meta = CATEGORY_META[mission.category as MissionCategory] ?? CATEGORY_META.chill;
      stamp = await db.stamp.create({
        data: {
          tripId: mission.tripId,
          missionId: mission.id,
          category: mission.category,
          ink: meta.ink,
        },
      });
    } else if (!done && stamp) {
      await db.stamp.delete({ where: { id: stamp.id } });
      stamp = null;
    }

    return NextResponse.json({ ok: true, mission: updated, stamp });
  } catch (err) {
    console.error("[missions/PATCH]", err);
    return NextResponse.json({ ok: false, error: "Could not update mission" }, { status: 500 });
  }
}
