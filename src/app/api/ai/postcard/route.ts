import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import ZAI from "z-ai-web-dev-sdk";
import { canSpend, spend, recordCacheHit, recordShowcase, showcaseLock } from "@/lib/cost-guard";
import { svgPostcard } from "@/lib/postcard-svg";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * THE POSTCARD PRESS — async job pattern.
 *
 * Why: image generation takes 25–60s. When the client awaited the image in the
 * POST response, an intermediary proxy in the preview chain severed requests
 * slower than ~30s — the server finished fine, but the browser saw a network
 * error ("PRESS JAMMED"). Now every HTTP request is short:
 *
 *   POST /api/ai/postcard  { city, country?, vibe, mode?, vehicle? }
 *     → { ok: true, id, status: "inking" }   (returns instantly)
 *
 *   GET  /api/ai/postcard?id=<job>
 *     → { ok: true, status: "inking" | "done" | "jammed", imageDataUrl?, note? }
 *
 * The press itself runs in the background with one retry and an overall
 * deadline. Jobs live in memory for 15 minutes, then are pruned.
 *
 * COST GUARD (see src/lib/cost-guard.ts):
 *   TIER 2 cache — completed presses sit in a 24h gallery keyed by scene;
 *                  a repeat press is an instant free replay (source:"cache")
 *   TIER 1 showcase — budget spent or AI_SHOWCASE=1 → locally drawn SVG
 *                  postcard (source:"showcase"), still a real postcard
 *   TIER 3 live — a real image generation, counted vs AI_HOURLY_BUDGET
 */

type JobStatus = "inking" | "done" | "jammed";

interface PostcardJob {
  id: string;
  status: JobStatus;
  imageDataUrl?: string;
  note?: string;
  prompt?: string;
  /** which tier produced this postcard */
  source?: "live" | "cache" | "showcase";
  createdAt: number;
}

const jobs = new Map<string, PostcardJob>();
const JOB_TTL_MS = 15 * 60 * 1000;
const PRESS_DEADLINE_MS = 110_000; // total budget incl. one retry

/**
 * THE GALLERY — completed postcards, cached by scene for 24h.
 * Cost answer: 50 judges pressing the same city = exactly ONE image
 * generation; every other press is an instant free replay.
 */
const GALLERY_TTL_MS = 24 * 60 * 60 * 1000;
const gallery = new Map<string, { imageDataUrl: string; at: number }>();

function galleryKey(city: string, mode: "air" | "road", vehicle: "bus" | "train", vibe: string) {
  return `${mode}:${vehicle}:${vibe}:${city.toLowerCase()}`;
}

function pruneGallery() {
  const now = Date.now();
  for (const [k, v] of gallery) {
    if (now - v.at > GALLERY_TTL_MS) gallery.delete(k);
  }
}

function pruneJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}

/** Vibe-specific foreground flavor so the postcard reflects the trip's mood. */
const VIBE_FLAVOR: Record<string, string> = {
  chill: "slow golden-hour light, calm water and a lazy hammock mood",
  foodie: "steaming street-food stalls and chai glasses in the foreground",
  explorer: "hidden viewpoints, winding paths and distant hills to conquer",
  weird: "a delightfully odd roadside landmark with quirky details",
  maxout: "a packed panoramic scene bursting with things to do",
};

function buildPrompt(
  city: string,
  country: string,
  mode: "air" | "road",
  vehicle: "bus" | "train",
  vibe: string,
): string {
  const scene =
    mode === "road"
      ? vehicle === "train"
        ? "a classic Indian passenger train crossing a low bridge over palm-lined backwaters, chai steam rising from a window, warm amber and cream dusk sky"
        : "a red-and-cream inter-state bus winding up a green ghat road with hairpin bends, past palm trees and a small roadside tea stall, warm amber and cream sky"
      : "airport terminal silhouette with a departing airplane in a warm amber and cream sky";
  const flavor = VIBE_FLAVOR[vibe] ?? "";
  return [
    `Vintage travel postcard illustration of ${city}${country ? ", " + country : ""}`,
    scene,
    flavor,
    "retro screen-print style, bold flat shapes, travel poster aesthetic",
    "no text, no letters, no watermark, high quality",
  ]
    .filter(Boolean)
    .join(", ");
}

/** Background worker — never awaited by the request handler. */
async function runPress(job: PostcardJob, prompt: string, gKey: string | null) {
  const deadline = Date.now() + PRESS_DEADLINE_MS;
  let lastMsg = "postcard press failure";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const remaining = deadline - Date.now();
      if (remaining < 5_000) break;

      const zai = await ZAI.create();
      const response = await Promise.race([
        zai.images.generations.create({ prompt, size: "1344x768" }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("postcard press timeout")), remaining),
        ),
      ]);

      const b64 = response?.data?.[0]?.base64;
      if (!b64) throw new Error("Empty image payload");

      job.status = "done";
      job.imageDataUrl = `data:image/png;base64,${b64}`;
      job.prompt = prompt;
      job.source = "live";
      if (gKey) gallery.set(gKey, { imageDataUrl: job.imageDataUrl, at: Date.now() });
      console.log(`[ai/postcard] ${job.id}: pressed on attempt ${attempt}`);
      return;
    } catch (err) {
      lastMsg = err instanceof Error ? err.message : "postcard press failure";
      console.error(`[ai/postcard] ${job.id} attempt ${attempt}:`, lastMsg);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1_500));
    }
  }

  job.status = "jammed";
  job.note = lastMsg;
}

export async function POST(req: NextRequest) {
  let body: {
    city?: string;
    country?: string;
    vibe?: string;
    iata?: string;
    mode?: string;
    vehicle?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const city = (body.city ?? "somewhere").slice(0, 60);
  const country = (body.country ?? "").slice(0, 60);
  const vibe = (body.vibe ?? "explorer").slice(0, 30);
  const iata = (body.iata ?? "").toUpperCase().slice(0, 3);
  const mode: "air" | "road" = body.mode === "road" ? "road" : "air";
  const vehicle: "bus" | "train" = body.vehicle === "train" ? "train" : "bus";

  const prompt = buildPrompt(city, country, mode, vehicle, vibe);

  pruneJobs();
  pruneGallery();
  const job: PostcardJob = { id: randomUUID(), status: "inking", createdAt: Date.now() };

  // ── TIER 2 · CACHED: same scene pressed within 24h → instant free replay
  const gKey = galleryKey(city, mode, vehicle, vibe);
  const gHit = gallery.get(gKey);
  if (gHit) {
    job.status = "done";
    job.imageDataUrl = gHit.imageDataUrl;
    job.prompt = prompt;
    job.source = "cache";
    jobs.set(job.id, job);
    recordCacheHit();
    console.log(`[ai/postcard] ${job.id}: gallery replay for ${iata || city} (0 calls spent)`);
    return NextResponse.json({ ok: true, id: job.id, status: "done" as JobStatus, cached: true });
  }

  jobs.set(job.id, job);

  // ── TIER 1 · SHOWCASE: budget spent / showcase lock → the local press
  if (showcaseLock() || !canSpend("postcard")) {
    job.status = "done";
    job.imageDataUrl = svgPostcard(city, country, mode, vehicle, vibe);
    job.prompt = prompt;
    job.source = "showcase";
    recordShowcase();
    console.log(
      `[ai/postcard] ${job.id}: showcase press (SVG, 0 calls) for ${iata || city} — ${showcaseLock() ? "lock on" : "hourly budget spent"}`,
    );
    return NextResponse.json({ ok: true, id: job.id, status: "done" as JobStatus, showcase: true });
  }

  // ── TIER 3 · LIVE: a real press, counted against the hourly budget
  spend("postcard");

  // Fire-and-forget: the POST responds immediately so no proxy in the chain
  // can ever sever the press again.
  void runPress(job, prompt, gKey);
  console.log(`[ai/postcard] ${job.id}: press started for ${iata || city} (${mode}/${vehicle})`);

  return NextResponse.json({ ok: true, id: job.id, status: "inking" as JobStatus });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const job = jobs.get(id);
  if (!job) {
    return NextResponse.json({ ok: false, error: "Unknown press job" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    id: job.id,
    status: job.status,
    imageDataUrl: job.imageDataUrl,
    note: job.note,
    source: job.source,
  });
}
