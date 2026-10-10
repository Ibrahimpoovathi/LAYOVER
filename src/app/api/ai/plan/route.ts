import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import {
  planSchema,
  Plan,
  VIBES,
  PlanMode,
  VehicleId,
  AccessProfileId,
  ACCESS_PROFILE_IDS,
  ACCESS_PROFILE_META,
  applyAccessProfile,
} from "@/lib/plan-schema";
import { canSpend, spend, recordCacheHit, recordShowcase, showcaseLock } from "@/lib/cost-guard";
import {
  DEMO_PLANS,
  ROAD_DEMO_PLANS,
  WHEELS_DEMO_JOURNEYS,
  ROUTE_FLAVOR,
  genericDemoPlan,
  genericRoadPlan,
  genericWheelsPlan,
} from "@/lib/demo-mode";
import { findAirport } from "@/lib/airports";

export const runtime = "nodejs";
export const maxDuration = 60;

// ── simple in-memory cache (local memory caching, no middleware) ──
// 24h TTL — COST GUARD tier 2: a route planned once today is free all day,
// so repeat demos and judge re-clicks never hit the LLM twice.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { plan: Plan; at: number }>();

function cacheKey(
  mode: PlanMode,
  vehicle: VehicleId | null,
  iata: string,
  dest: string,
  durationMin: number,
  vibe: string,
  access: AccessProfileId
) {
  return `${mode}:${vehicle ?? "-"}:${iata}>${dest}:${durationMin}:${vibe}:${access}`;
}

// ── robust JSON extraction from an LLM response ──
function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/```json/gi, "```")
    .split("```")
    .map((s) => s.trim())
    .filter(Boolean);
  const candidates = [text, ...cleaned];
  for (const c of candidates) {
    const start = c.indexOf("{");
    const end = c.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) continue;
    try {
      return JSON.parse(c.slice(start, end + 1));
    } catch {
      // try next candidate
    }
  }
  throw new Error("No parseable JSON in model response");
}

const SYSTEM_PROMPT = `You are GATE CONTROL, the mischievous flight-ops brain behind "LAYOVER" — an app that turns airport layovers into micro-adventures.

You design layover MISSIONS: small, specific, delightfully doable quests inside (or barely outside) the airport, timed to the traveler's real layover window. Tone: playful, confident, a little poetic, never corporate. Useful is fine, weird is welcome, but every mission must be genuinely doable at that airport during that layover.

STRICT OUTPUT RULES:
- Respond with ONE valid JSON object only. No markdown fences, no commentary.
- Schema:
{
  "adventureTitle": string (evocative, max 8 words),
  "airport": { "iata": "3-letter code", "city": string, "country": string },
  "vibe": string,
  "totalDurationMin": number,
  "bufferMin": number (30-150; realistic immigration+security buffer),
  "funFact": string (one surprising true-ish fact about the airport or city, max 200 chars),
  "missions": [
    {
      "title": string (max 8 words),
      "description": string (max 240 chars, imperative voice, specific),
      "durationMin": number (multiple of 5),
      "category": "eat" | "explore" | "chill" | "move" | "weird" | "rest",
      "location": string (terminal/concourse level specificity),
      "tip": string (optional, max 120 chars)
    }
  ]
}
- Sum of mission durations + bufferMin should be <= totalDurationMin.
- 2-5 missions depending on window size (short layover -> fewer, tighter missions).
- At least one "eat" mission unless vibe is "weird". Include exactly one "weird" or playful mission for charm.
- Use realistic airport features (lounges, observation decks, showers, food, art, transit). If city exit is unrealistic for the window, keep everything inside the airport and say why in a tip.
- Vary categories. No mission under 15 min.`;

const ROAD_SYSTEM_PROMPT = `You are ROUTE CONTROL, the roadside genius behind "LAYOVER" WHEELS mode — an app that turns long bus and train journeys into micro-adventures.

You design JOURNEY STAGES: small, specific, delightfully doable quests that happen DURING a real overland journey — at the boarding point, on board, at meal halts and junction waits, at viewpoints, and on arrival. Tone: playful, confident, a little poetic, never corporate. Every stage must be genuinely doable by a traveler on that exact vehicle for that duration, without abandoning their luggage or missing their ride.

GROUND WISDOM — BUS: boarding-bay chaos and checker diplomacy, last-row culture, window-seat claims, meal halts at dhabas and food malls (the driver's dish is the right dish), ghat sections with hairpin countdowns, windmill farms, toll plazas, the bus-TV movie, arrival-bay chai.
GROUND WISDOM — TRAIN: platform chai at long junction halts, pantry-car negotiations, window-shutter politics, coach-position guesswork, station bookstalls, two-minute vendors, backwaters and ghats from the window, the 4am arrival fog.

STRICT OUTPUT RULES:
- Respond with ONE valid JSON object only. No markdown fences, no commentary.
- Schema:
{
  "adventureTitle": string (evocative, max 8 words),
  "airport": { "iata": "3-letter ORIGIN code", "city": "origin city", "country": string },
  "vibe": string,
  "vehicle": "bus" | "train" (MUST match the requested vehicle),
  "destination": { "city": "destination city", "code": "destination stop code" },
  "routeCode": string (short highway/rail flavor, max 20 chars, e.g. "NH-766 GHAT", "COASTAL LINE", "NH-66"),
  "fareJoke": string (funny fare, max 60 chars, e.g. "4 CHAI + 2 PAROTTA", "3 CHAI + 1 VADA"),
  "totalDurationMin": number,
  "bufferMin": number (30-150; boarding + arrival slack),
  "funFact": string (one surprising true-ish fact about the route, the vehicle culture, or the destination, max 200 chars),
  "missions": [
    {
      "title": string (max 8 words),
      "description": string (max 240 chars, imperative voice, specific),
      "durationMin": number (multiple of 5),
      "category": "eat" | "explore" | "chill" | "move" | "weird" | "rest",
      "location": string (journey-anchored: "ON BOARD", "AT the Kalpetta halt", "PLATFORM 2 during the halt"),
      "tip": string (optional, max 120 chars)
    }
  ]
}
- Sum of mission durations + bufferMin should be <= totalDurationMin.
- 2-5 missions. The stages must SPAN THE JOURNEY ARC: one near departure, at least one ON BOARD, one at a halt, one near arrival.
- At least one "eat" mission unless vibe is "weird". Include exactly one "weird" or playful mission for charm.
- Use REAL route knowledge when you have it (highways, ghats, famous halts, stations). If unsure, invent plausible flavor but keep it grounded.
- Vary categories. No mission under 15 min.`;

function userPrompt(
  mode: PlanMode,
  iata: string,
  city: string,
  country: string,
  durationMin: number,
  vibe: string,
  vehicle: VehicleId | null,
  destCity: string | null,
  destCode: string | null,
  access: AccessProfileId
) {
  const vibeHint = VIBES.find((v) => v.id === vibe)?.hint ?? vibe;
  const accessNote =
    access !== "none"
      ? ` The traveler files an assistance code: ${access.toUpperCase()} — every mission MUST carry "distanceM" (meters, integer), "stepFree" (boolean) and "sensory" ("quiet" | "moderate" | "loud") fields honoring it.`
      : "";
  if (mode === "road" && destCity) {
    return `Design the journey: ${vehicle?.toUpperCase() ?? "BUS"} from ${city} (${iata}) to ${destCity} (${destCode ?? "—"}), total time on the road ${durationMin} minutes, traveler vibe: "${vibe}" (${vibeHint}). Vehicle: ${vehicle ?? "bus"}. Stages must span the whole ride — boarding, on board, a halt, arrival.${accessNote} Return the JSON object now.`;
  }
  const kind = mode === "road" ? "bus stand / highway halt" : "airport";
  return `Design the layover: ${kind} ${iata} (${city}, ${country}), layover window ${durationMin} minutes, traveler vibe: "${vibe}" (${vibeHint}).${accessNote} Return the JSON object now.`;
}

type DemoArgs = {
  mode: PlanMode;
  iata: string;
  city: string;
  country: string;
  durationMin: number;
  vibe: string;
  vehicle: VehicleId | null;
  destCity: string | null;
  destCode: string | null;
  accessProfile: AccessProfileId;
};

function demoFallback(a: DemoArgs): Plan {
  const { mode, iata, city, country, durationMin, vibe, vehicle, destCity, destCode, accessProfile } = a;
  const stamp = (p: Plan) => applyAccessProfile(p, accessProfile);
  if (mode === "road") {
    if (destCity) {
      const key = `${iata.toUpperCase()}>${(destCode ?? "").toUpperCase()}`;
      const journey = WHEELS_DEMO_JOURNEYS[key];
      const v: VehicleId = vehicle ?? "bus";
      if (journey) {
        return stamp({
          ...journey,
          vibe,
          vehicle: v,
          totalDurationMin: Math.max(durationMin, journey.totalDurationMin),
        });
      }
      return stamp(
        genericWheelsPlan(iata, city, country || "Unknown", destCode ?? "???".slice(0, 3), destCity, v, vibe),
      );
    }
    // stop-based road plan (no destination given)
    const base = ROAD_DEMO_PLANS[iata.toUpperCase()];
    if (base) {
      return stamp({ ...base, vehicle: vehicle ?? undefined, vibe, totalDurationMin: Math.max(durationMin, base.totalDurationMin) });
    }
    return stamp(genericRoadPlan(iata, city, country || "Unknown", vibe));
  }
  const base = DEMO_PLANS[iata.toUpperCase()];
  if (base) {
    return stamp({ ...base, mode, totalDurationMin: Math.max(durationMin, base.totalDurationMin), vibe });
  }
  return stamp(genericDemoPlan(iata, city, country || "Unknown", vibe));
}

export async function POST(req: NextRequest) {
  let body: {
    iata?: string;
    city?: string;
    country?: string;
    durationMin?: number;
    vibe?: string;
    mode?: string;
    vehicle?: string;
    destination?: { city?: string; code?: string };
    accessProfile?: string;
    forceDemo?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const iata = (body.iata ?? "").toUpperCase().slice(0, 3);
  const durationMin = Math.min(Math.max(Number(body.durationMin) || 180, 60), 720);
  const vibe = body.vibe ?? "explorer";
  const mode: PlanMode = body.mode === "road" ? "road" : "air";
  const vehicle: VehicleId | null =
    mode === "road" ? (body.vehicle === "train" ? "train" : "bus") : null;
  const destCity = mode === "road" ? (body.destination?.city ?? "").trim().slice(0, 60) || null : null;
  const destCode = mode === "road" ? (body.destination?.code ?? "").toUpperCase().slice(0, 6) || null : null;
  const airport = findAirport(iata);
  const city = body.city ?? airport?.city ?? iata;
  const country = body.country ?? airport?.country ?? "";
  // EVERY BODY BOARDS — the IATA SSR assistance code this plan must honor
  const accessProfile: AccessProfileId = (ACCESS_PROFILE_IDS as string[]).includes(
    body.accessProfile ?? "none",
  )
    ? (body.accessProfile as AccessProfileId)
    : "none";

  if (!/^[A-Z]{3}$/.test(iata)) {
    return NextResponse.json({ ok: false, error: "Valid 3-letter stop code required" }, { status: 400 });
  }

  // demo mode NEVER reads the cache — it must always serve the demo locker
  if (body.forceDemo) {
    return NextResponse.json({
      ok: true,
      plan: demoFallback({ mode, iata, city, country, durationMin, vibe, vehicle, destCity, destCode, accessProfile }),
      source: "demo",
    });
  }

  const key = cacheKey(mode, vehicle, iata, destCity ?? "-", durationMin, vibe, accessProfile);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    recordCacheHit();
    return NextResponse.json({ ok: true, plan: hit.plan, source: "cache" });
  }

  // ── COST GUARD tier 1: budget spent / showcase lock → the demo locker
  // still plans the journey, just from local fixtures instead of the LLM.
  if (showcaseLock() || !canSpend("plan")) {
    recordShowcase();
    return NextResponse.json({
      ok: true,
      plan: demoFallback({ mode, iata, city, country, durationMin, vibe, vehicle, destCity, destCode, accessProfile }),
      source: "showcase",
      note: showcaseLock() ? "showcase lock on" : "hourly AI budget spent — serving the demo locker",
    });
  }

  try {
    spend("plan"); // count one LIVE call against the hourly budget
    const zai = await ZAI.create();
    const baseSystem = mode === "road" ? ROAD_SYSTEM_PROMPT : SYSTEM_PROMPT;
    // EVERY BODY BOARDS — inject the SSR directive so the model designs FOR
    // the body, not around it; the access fields join the JSON contract via
    // the user prompt note.
    const directive = ACCESS_PROFILE_META[accessProfile].directive;
    const systemPrompt = directive ? `${baseSystem}\n\n${directive}` : baseSystem;

    const completion = await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt },
          {
            role: "user",
            content: userPrompt(mode, iata, city, country, durationMin, vibe, vehicle, destCity, destCode, accessProfile),
          },
        ],
        thinking: { type: "disabled" },
      }),
      new Promise<{ choices: { message?: { content?: string } } }>((_, reject) =>
        setTimeout(() => reject(new Error("Gate control timeout")), 48_000)
      ),
    ]);

    const raw = completion?.choices?.[0]?.message?.content ?? "";
    const parsed = planSchema.parse(extractJson(raw));

    // hard-correct fields the model may drift on, then enforce the SSR
    // promise deterministically (never trust the model with access data)
    const routeKey = `${iata}>${destCode ?? ""}`;
    const plan: Plan = applyAccessProfile(
      {
        ...parsed,
        mode,
        vehicle: mode === "road" ? (vehicle ?? parsed.vehicle ?? "bus") : undefined,
        destination:
          mode === "road" && destCity
            ? { city: destCity, code: destCode ?? parsed.destination?.code }
            : undefined,
        routeCode:
          mode === "road"
            ? (parsed.routeCode ?? ROUTE_FLAVOR[routeKey] ?? (vehicle === "train" ? "RAIL · EXPRESS" : "NH-∞")).slice(0, 28)
            : undefined,
        airport: {
          iata,
          city: parsed.airport.city || city,
          country: parsed.airport.country || country || undefined,
        },
        totalDurationMin: durationMin,
        vibe,
      },
      accessProfile,
    );

    cache.set(key, { plan, at: Date.now() });
    return NextResponse.json({ ok: true, plan, source: "ai" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown gate control error";
    console.error("[ai/plan] falling back to demo:", msg);
    return NextResponse.json({
      ok: true,
      plan: demoFallback({ mode, iata, city, country, durationMin, vibe, vehicle, destCity, destCode, accessProfile }),
      source: "demo",
      note: msg,
    });
  }
}
