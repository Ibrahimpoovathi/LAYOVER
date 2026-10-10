import { z } from "zod";

/**
 * The contract between our AI and the UI.
 * The LLM must emit EXACTLY this shape — zod verifies it, demo-mode mimics it.
 */

export const MISSION_CATEGORIES = [
  "eat",
  "explore",
  "chill",
  "move",
  "weird",
  "rest",
] as const;

export type MissionCategory = (typeof MISSION_CATEGORIES)[number];

export const VIBES = [
  { id: "chill", label: "Chill", hint: "slow, cozy, low effort" },
  { id: "foodie", label: "Foodie", hint: "eat the terminal" },
  { id: "explorer", label: "Explorer", hint: "see everything possible" },
  { id: "weird", label: "Weird", hint: "strange delights only" },
  { id: "maxout", label: "Max Out", hint: "squeeze every minute" },
] as const;

export type VibeId = (typeof VIBES)[number]["id"];

/** Transport modes — the plan engine is mode-agnostic, only flavor changes.
 *  Internal ids stay "air"/"road" forever (DB compat).
 *  User-facing labels are WINGS / WHEELS (see src/lib/modes.ts). */
export const MODE_IDS = ["air", "road"] as const;
export type PlanMode = (typeof MODE_IDS)[number];

/** ── EVERY BODY BOARDS — assistance profiles ──
 *  Real IATA SSR codes (Special Service Request) travelers actually book
 *  with, printed on the artifact like any airline would:
 *   WCHR = wheelchair, can walk short distances (ramp assistance)
 *   DPNA = autistic / neurodivergent traveler needing assistance
 *   DEAF = deaf / hard-of-hearing traveler
 *  "none" is the absence of a code — the default boarding experience. */
export const ACCESS_PROFILES = [
  {
    id: "none",
    ssr: null,
    label: "Standard",
    hint: "no assistance code on this ticket",
    directive: null,
  },
  {
    id: "wchr",
    ssr: "WCHR",
    label: "Step-Free",
    hint: "wheelchair / limited walking — every mission step-free, short rolls",
    directive:
      "TRAVELER ASSISTANCE — SSR WCHR (wheelchair, walks short distances only): EVERY mission must be step-free (elevators/ramps exist at the venue; never stairs-only routes, never long walks). Keep each mission within a 400 m roll of the previous point. Mention the accessible feature (lift, ramp, level entrance) in the location or tip.",
  },
  {
    id: "dpna",
    ssr: "DPNA",
    label: "Low-Stim",
    hint: "neurodivergent traveler — quiet, predictable, short-burst missions",
    directive:
      "TRAVELER ASSISTANCE — SSR DPNA (autistic traveler, sensory-sensitive): EVERY mission must be quiet and predictable. Prefer calm corners, lounges, quiet cafes, uncrowded viewpoints; explicitly avoid crowds, live music, fireworks, surprise elements. One mission at a time with a clear start and end (short bursts), and include in each tip one concrete 'quiet exit' the traveler can take if it gets loud.",
  },
  {
    id: "deaf",
    ssr: "DEAF",
    label: "Visual Announcements",
    hint: "deaf / hard of hearing — every announcement gets a visual twin",
    directive:
      "TRAVELER ASSISTANCE — SSR DEAF (deaf traveler): never rely on audio-only experiences. Every mission must work visually: prefer venues where you order by menu/point/screen, note visual cues (departure boards, screens, written signs) in the location or tip. If a mission involves an announcement or PA call, the tip must name the visual alternative (watch the board, the screen above gate, staff with a placard).",
  },
] as const;

export type AccessProfileId = (typeof ACCESS_PROFILES)[number]["id"];

export const ACCESS_PROFILE_IDS = ACCESS_PROFILES.map((p) => p.id) as AccessProfileId[];

export const ACCESS_PROFILE_META: Record<
  AccessProfileId,
  (typeof ACCESS_PROFILES)[number]
> = ACCESS_PROFILES.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<AccessProfileId, (typeof ACCESS_PROFILES)[number]>,
);

/** Sensory load labels for mission chips. */
export const SENSORY_LEVELS = ["quiet", "moderate", "loud"] as const;
export type SensoryLevel = (typeof SENSORY_LEVELS)[number];

/** WHEELS vehicles — bus AND train share the highway skin. */
export const VEHICLES = ["bus", "train"] as const;
export type VehicleId = (typeof VEHICLES)[number];

export const VEHICLE_META: Record<VehicleId, { label: string; ticketBand: string; fare: string }> = {
  bus: { label: "BUS", ticketBand: "LAYOVER STATE ROADWAYS · WHEELS DIVISION", fare: "4 CHAI + 2 PAROTTA" },
  train: { label: "TRAIN", ticketBand: "LAYOVER RAILWAYS · WHEELS DIVISION", fare: "3 CHAI + 1 VADA" },
};

export const missionSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().min(10).max(280),
  durationMin: z.number().int().min(15).max(300),
  category: z.enum(MISSION_CATEGORIES),
  location: z.string().min(2).max(120),
  tip: z.string().max(160).optional(),
  // ── EVERY BODY BOARDS — access metadata (optional so classic plans validate) ──
  distanceM: z.number().int().min(0).max(5000).optional(), // walking/rolling distance from previous point
  stepFree: z.boolean().optional(), // elevator/ramp/level route exists
  sensory: z.enum(SENSORY_LEVELS).optional(), // expected sensory load
});

export const planSchema = z.object({
  adventureTitle: z.string().min(3).max(90),
  airport: z.object({
    iata: z.string().length(3),
    city: z.string().min(1),
    country: z.string().min(1).optional(),
  }),
  vibe: z.string().min(1),
  mode: z.enum(MODE_IDS).optional(), // absent = "air" (backwards compatible)
  // ── WHEELS (road) fields — all optional so air plans validate unchanged ──
  vehicle: z.enum(VEHICLES).optional(), // "bus" | "train"
  destination: z
    .object({
      city: z.string().min(1).max(60),
      code: z.string().max(6).optional(),
    })
    .optional(), // journey model: FROM airport.city → destination.city
  routeCode: z.string().max(28).optional(), // "NH-766" / "COASTAL LINE"
  fareJoke: z.string().max(120).optional(), // "4 CHAI + 2 PAROTTA"
  totalDurationMin: z.number().int().min(60).max(720),
  bufferMin: z.number().int().min(30).max(180),
  funFact: z.string().min(10).max(220),
  missions: z.array(missionSchema).min(2).max(6),
  // ── EVERY BODY BOARDS — the SSR code this plan was designed around ──
  accessProfile: z.enum(ACCESS_PROFILE_IDS as [AccessProfileId, ...AccessProfileId[]]).optional(),
  // ── USP-A "THE BOARD DEFENDS YOUR TIME" — replanned schedules start from
  // the clock's current journey minute (0 = issued at T+00:00) ──
  windowAnchorMin: z.number().int().min(0).max(720).optional(),
});

export type Plan = z.infer<typeof planSchema>;
export type Mission = z.infer<typeof missionSchema>;

/** Category → visual language (ink colors for stamps, icons, labels). */
export const CATEGORY_META: Record<
  MissionCategory,
  { label: string; ink: string; ring: string }
> = {
  eat: { label: "EAT", ink: "#c2452d", ring: "#c2452d" },
  explore: { label: "EXPLORE", ink: "#2d7d74", ring: "#2d7d74" },
  chill: { label: "CHILL", ink: "#8a6d3b", ring: "#8a6d3b" },
  move: { label: "MOVE", ink: "#5b5b8a", ring: "#5b5b8a" },
  weird: { label: "WEIRD", ink: "#a3497c", ring: "#a3497c" },
  rest: { label: "REST", ink: "#6f6a5c", ring: "#6f6a5c" },
};

/** Deterministic distance estimate when the model omits one — by category. */
const DEFAULT_DISTANCE_M: Record<MissionCategory, number> = {
  eat: 150,
  explore: 400,
  chill: 100,
  move: 600,
  weird: 300,
  rest: 80,
};

/**
 * EVERY BODY BOARDS — stamp an assistance profile onto a plan AFTER the LLM
 * (or demo locker) responds. The LLM gets a directive, but we never TRUST it:
 * this function deterministically enforces the promise the profile makes, so
 * the chips on the ticket are always true:
 *   WCHR → every mission step-free, rolls capped at 400 m
 *   DPNA → every mission quiet, bursts capped at 600 m
 *   DEAF → distances guaranteed present; the visual-twin lives in the UI
 * Missions without model-supplied fields get honest category-based estimates.
 */
export function applyAccessProfile(plan: Plan, profile: AccessProfileId | undefined): Plan {
  if (!profile || profile === "none") return plan;
  const cap = profile === "wchr" ? 400 : profile === "dpna" ? 600 : 5000;
  return {
    ...plan,
    accessProfile: profile,
    missions: plan.missions.map((m) => {
      const distance = Math.min(
        m.distanceM ?? DEFAULT_DISTANCE_M[m.category as MissionCategory] ?? 300,
        cap,
      );
      return {
        ...m,
        distanceM: distance,
        stepFree: profile === "wchr" ? true : (m.stepFree ?? true),
        sensory:
          profile === "dpna" ? ("quiet" as SensoryLevel) : (m.sensory ?? "moderate"),
      };
    }),
  };
}

/** Total walking/rolling distance across the mission chain, in meters. */
export function walkTotalM(plan: Plan): number {
  return plan.missions.reduce((s, m) => s + (m.distanceM ?? 0), 0);
}

/** Utility: format minutes as "5h 20m" */
export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/** Utility: compute mission start offsets given a total window + buffer. */
export function missionOffsets(plan: Plan): number[] {
  const available = Math.max(plan.totalDurationMin - plan.bufferMin, 30);
  const totalMission = plan.missions.reduce((s, m) => s + m.durationMin, 0);
  const scale = totalMission > available ? available / totalMission : 1;
  let acc = 0;
  return plan.missions.map((m) => {
    const start = acc;
    acc += Math.round(m.durationMin * scale);
    return start;
  });
}

/**
 * USP-A — anchor-aware mission schedule: starts AND ends in journey minutes.
 * A replanned plan carries windowAnchorMin (the clock minute the revised
 * schedule starts from), so fresh windows are honest about the time that's
 * already gone. The remaining play window (total − buffer − anchor) is what
 * missions get compressed into.
 */
export function missionStarts(plan: Plan): { starts: number[]; ends: number[] } {
  const anchor = plan.windowAnchorMin ?? 0;
  const available = Math.max(plan.totalDurationMin - plan.bufferMin - anchor, 30);
  const totalMission = plan.missions.reduce((s, m) => s + m.durationMin, 0);
  const scale = totalMission > available ? available / totalMission : 1;
  let acc = 0;
  const starts: number[] = [];
  const ends: number[] = [];
  for (const m of plan.missions) {
    starts.push(anchor + acc);
    acc += Math.round(m.durationMin * scale);
    ends.push(anchor + acc);
  }
  return { starts, ends };
}
