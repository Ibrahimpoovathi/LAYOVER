import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { canSpend, spend, showcaseLock } from "@/lib/cost-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/transcribe  { audio: base64, mime?: string }
 * → { ok: true, text }
 *
 * THE PA-READER — server-side speech-to-text for the DEAF caption feed.
 * The browser's SpeechRecognition engine is realtime but fragile: it is
 * missing on Firefox/Safari, and silently dies inside sandboxed preview
 * iframes ("service-not-allowed") and on flaky networks ("network").
 * This route is the honest engine: the client records a short clip with
 * MediaRecorder and posts the bytes — same infrastructure as the rest of
 * the terminal, so if the terminal works, captions work.
 *
 * COST GUARD: counted as a LIVE call against the same rolling-hour budget;
 * when the budget is spent the route answers 429 and the LED shows its
 * scripted status instead (never a blank board).
 */

const MAX_AUDIO_BYTES = 12 * 1024 * 1024; // ~12 MB base64 payload ceiling

export async function POST(req: NextRequest) {
  let body: { audio?: string; mime?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const audio = (body.audio ?? "").replace(/^data:[^;]+;base64,/, "");
  if (!audio) {
    return NextResponse.json({ ok: false, error: "audio (base64) is required" }, { status: 400 });
  }
  if (audio.length > MAX_AUDIO_BYTES) {
    return NextResponse.json({ ok: false, error: "clip too long — keep it under ~30 seconds" }, { status: 413 });
  }

  // tier 1 — budget spent / showcase lock: stay honest rather than spend
  if (showcaseLock() || !canSpend("transcribe")) {
    return NextResponse.json(
      { ok: false, error: "cost guard: caption channel is resting — announcement captions still work" },
      { status: 429 },
    );
  }

  try {
    spend("transcribe");
    const zai = await ZAI.create();
    const response = await Promise.race([
      zai.audio.asr.create({ file_base64: audio }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("caption channel timeout")), 30_000),
      ),
    ]);

    const text = (response?.text ?? "").replace(/\s+/g, " ").trim();
    if (!text) {
      // engine heard nothing intelligible — honest, not an error
      return NextResponse.json({ ok: true, text: "", empty: true });
    }
    return NextResponse.json({ ok: true, text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "caption channel failure";
    console.error("[ai/transcribe]:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 503 });
  }
}
