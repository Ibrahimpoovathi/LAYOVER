import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * THE CREW GATE — login that gamifies identity.
 *
 * POST /api/auth/login  { nickname, pin }
 *   A traveler is identified by CALLSIGN + 4-digit CREW PIN (like an airport
 *   staff code). Rules:
 *     • new callsign          → the PIN claims it (crew member created)
 *     • existing, no PIN yet  → the PIN claims the name
 *     • existing + PIN        → must match (the leaderboard can't be trolled)
 *   PINs are stored as sha256 hashes, never plaintext.
 *   → { ok, traveler: { id, nickname, trips, badges } }
 *
 * GET /api/auth/login?id=... — session restore for a returning page load.
 *   → { ok, traveler } | 404
 *
 * badges = passport stamps collected across all trips (1 per completed
 * mission). That count is the leaderboard currency.
 */

function hashPin(pin: string): string {
  return createHash("sha256").update(`layover-crew:${pin}`).digest("hex");
}

function cleanNickname(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 20);
}

async function crewPayload(travelerId: string) {
  const t = await db.traveler.findUnique({
    where: { id: travelerId },
    include: { trips: { include: { stamps: { select: { id: true } } } } },
  });
  if (!t) return null;
  return {
    id: t.id,
    nickname: t.nickname,
    trips: t.trips.length,
    badges: t.trips.reduce((n, tr) => n + tr.stamps.length, 0),
  };
}

export async function POST(req: NextRequest) {
  try {
    let body: { nickname?: string; pin?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const nickname = cleanNickname(body.nickname);
    const pin = String(body.pin ?? "").trim();

    if (nickname.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Callsign needs at least 2 letters (letters, numbers, . _ -)" },
        { status: 400 },
      );
    }
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ ok: false, error: "Crew PIN is exactly 4 digits" }, { status: 400 });
    }

    const existing = await db.traveler.findUnique({ where: { nickname } });
    const hash = hashPin(pin);

    if (existing && existing.pinHash && existing.pinHash !== hash) {
      return NextResponse.json(
        { ok: false, error: "Callsign taken — that crew PIN doesn't match" },
        { status: 401 },
      );
    }

    const traveler = existing
      ? existing.pinHash
        ? existing
        : await db.traveler.update({ where: { id: existing.id }, data: { pinHash: hash } })
      : await db.traveler.create({ data: { nickname, pinHash: hash } });

    const payload = await crewPayload(traveler.id);
    return NextResponse.json({ ok: true, traveler: payload });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ ok: false, error: "The crew gate jammed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id") ?? "";
    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }
    const payload = await crewPayload(id);
    if (!payload) {
      return NextResponse.json({ ok: false, error: "Unknown crew id" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, traveler: payload });
  } catch (err) {
    console.error("[auth/login GET]", err);
    return NextResponse.json({ ok: false, error: "The crew gate jammed" }, { status: 500 });
  }
}
