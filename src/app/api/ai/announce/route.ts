import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { canSpend, spend, recordCacheHit, showcaseLock } from "@/lib/cost-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/announce  { text }
 * → audio/wav stream of a gate announcement.
 * Voice "jam" (English gentleman) — aviation-announcement energy.
 * Text capped at 600 chars (well under the 1024 TTS limit).
 *
 * COST GUARD: announcements repeat constantly (the same stage lines get
 * replayed), so finished clips are cached by text for 1h — a replay is a
 * free byte-stream, not a TTS call. Over budget → 429 and the UI keeps
 * its on-screen copy instead of speaking.
 */

const CLIP_TTL_MS = 60 * 60 * 1000;
const clipCache = new Map<string, { wav: Buffer; at: number }>();

function pruneClips() {
  const now = Date.now();
  for (const [k, v] of clipCache) {
    if (now - v.at > CLIP_TTL_MS) clipCache.delete(k);
  }
}

export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);

  if (!text) {
    return NextResponse.json({ ok: false, error: "text is required" }, { status: 400 });
  }

  pruneClips();

  // tier 2 — same line spoken this hour → free replay
  const clip = clipCache.get(text);
  if (clip) {
    clip.at = Date.now(); // touch: keep hot clips alive
    recordCacheHit();
    return new NextResponse(new Uint8Array(clip.wav), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": clip.wav.length.toString(),
        "Cache-Control": "no-cache",
      },
    });
  }

  // tier 1 — budget spent / showcase lock: stay silent rather than spend
  if (showcaseLock() || !canSpend("announce")) {
    return NextResponse.json(
      { ok: false, error: "cost guard: announcement channel is resting — the script is still on screen" },
      { status: 429 },
    );
  }

  try {
    spend("announce");
    const zai = await ZAI.create();
    const response = await Promise.race([
      zai.audio.tts.create({
        input: text,
        voice: "jam",
        speed: 0.95,
        response_format: "wav",
        stream: false,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("announce channel timeout")), 45_000)
      ),
    ]);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    if (buffer.length < 100) throw new Error("Empty audio payload");

    if (clipCache.size < 40) clipCache.set(text, { wav: buffer, at: Date.now() });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "announce channel failure";
    console.error("[ai/announce]:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 503 });
  }
}
