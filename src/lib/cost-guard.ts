/**
 * COST GUARD — the three-tier budget engine behind LAYOVER's AI features.
 *
 * The organizers' question: "AI costs money per call — what does running
 * this cost?" The answer is a hard architectural guarantee, not a promise:
 *
 *   TIER 1 · SHOWCASE  — deterministic local fixtures (demo plans, SVG
 *             postcards). Zero network calls. Zero rupees. Served whenever
 *             the demo lock is on, AI_SHOWCASE=1 is set, or the hourly
 *             budget is spent.
 *   TIER 2 · CACHED    — every AI result is cached (plans 24h, postcards
 *             24h, announcements 1h). A repeat request costs nothing, so
 *             50 judges mashing the demo button trigger exactly ONE real
 *             press.
 *   TIER 3 · LIVE      — a real SDK call, counted against a rolling-hour
 *             budget (AI_HOURLY_BUDGET, default 60). The budget is a hard
 *             ceiling: below the line you get live AI, at the line every
 *             feature degrades gracefully to Tier 1 instead of failing.
 *
 * All state is in-memory (per server instance) — no middleware, no cost.
 */

export type CostKind = "plan" | "postcard" | "announce";
export type CostTier = "showcase" | "cache" | "live";

/** Hard ceiling on LIVE AI calls per rolling hour. Env-tunable. */
const HOURLY_BUDGET = Number(process.env.AI_HOURLY_BUDGET ?? 60);
/** Env kill-switch: when "1", every feature serves Tier-1 content only. */
const SHOWCASE_LOCK = process.env.AI_SHOWCASE === "1";

interface CostState {
  windowStart: number;
  live: Record<CostKind, number>;
  totalLive: number;
  cacheHits: number;
  showcaseServes: number;
}

// survive route-module reloads in dev by hanging state off globalThis
const store = globalThis as unknown as { __layoverCost?: CostState };

function state(): CostState {
  if (!store.__layoverCost) {
    store.__layoverCost = {
      windowStart: Date.now(),
      live: { plan: 0, postcard: 0, announce: 0 },
      totalLive: 0,
      cacheHits: 0,
      showcaseServes: 0,
    };
  }
  return store.__layoverCost;
}

function roll(s: CostState) {
  if (Date.now() - s.windowStart >= 3_600_000) {
    s.windowStart = Date.now();
    s.live = { plan: 0, postcard: 0, announce: 0 };
  }
}

/** True when Tier-1 fixtures must be served unconditionally. */
export function showcaseLock(): boolean {
  return SHOWCASE_LOCK;
}

/** May a LIVE call be made right now? */
export function canSpend(kind: CostKind): boolean {
  if (SHOWCASE_LOCK) return false;
  const s = state();
  roll(s);
  return s.live[kind] < HOURLY_BUDGET;
}

/** Count one LIVE call against the budget (call it right before the SDK). */
export function spend(kind: CostKind): void {
  const s = state();
  roll(s);
  s.live[kind] += 1;
  s.totalLive += 1;
}

/** A repeat request was answered from cache — zero cost. */
export function recordCacheHit(): void {
  state().cacheHits += 1;
}

/** Tier-1 fixture served instead of a live call — zero cost. */
export function recordShowcase(): void {
  state().showcaseServes += 1;
}

export interface CostSnapshot {
  budget: number;
  liveThisHour: number;
  byKind: Record<CostKind, number>;
  remaining: number;
  cacheHits: number;
  showcaseServes: number;
  savedCalls: number;
  /** "ok" under budget · "warn" ≥80% · "capped" at the ceiling */
  tierState: "ok" | "warn" | "capped";
  showcaseLock: boolean;
  windowResetsInMin: number;
}

export function costSnapshot(): CostSnapshot {
  const s = state();
  roll(s);
  const liveThisHour = s.live.plan + s.live.postcard + s.live.announce;
  const pct = HOURLY_BUDGET > 0 ? liveThisHour / HOURLY_BUDGET : 1;
  return {
    budget: HOURLY_BUDGET,
    liveThisHour,
    byKind: { ...s.live },
    remaining: Math.max(0, HOURLY_BUDGET - liveThisHour),
    cacheHits: s.cacheHits,
    showcaseServes: s.showcaseServes,
    savedCalls: s.cacheHits + s.showcaseServes,
    tierState: SHOWCASE_LOCK ? "capped" : pct >= 1 ? "capped" : pct >= 0.8 ? "warn" : "ok",
    showcaseLock: SHOWCASE_LOCK,
    windowResetsInMin: Math.max(0, Math.ceil((3_600_000 - (Date.now() - s.windowStart)) / 60_000)),
  };
}
