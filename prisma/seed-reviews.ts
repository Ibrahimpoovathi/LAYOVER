/**
 * CREW REVIEWS — seed verdicts for every DEMO task.
 *
 * Run:  bun prisma/seed-reviews.ts   (dev server must be on :3000)
 *
 * Why via the API (not raw Prisma):
 *   • exercises the exact production path (login → review POST)
 *   • identical key normalization + validation as real traffic
 * Idempotent: one review per crew per task (upsert) — safe to re-run.
 *
 * Reviewers are fictional crew callsigns with claimed PINs; ratings lean
 * positive (3–5★) with a few honest 2★/PRICEY/SKIP notes so the board
 * looks lived-in, not rigged.
 */

import {
  DEMO_PLANS,
  ROAD_DEMO_PLANS,
  WHEELS_DEMO_JOURNEYS,
  genericDemoPlan,
  genericRoadPlan,
  genericWheelsPlan,
} from "../src/lib/demo-mode";
import { missionKeyOf } from "../src/lib/review-key";

const BASE = "http://localhost:3000";

interface SeedCrew {
  nickname: string;
  pin: string;
}

const CREW: SeedCrew[] = [
  { nickname: "PLANE-JANE", pin: "1201" },
  { nickname: "CONDUCTOR-VJ", pin: "4242" },
  { nickname: "MANGO-RIDER", pin: "7733" },
  { nickname: "GATE-42", pin: "4242" },
  { nickname: "LAYOVER-LILA", pin: "8080" },
  { nickname: "STARLING", pin: "5121" },
  { nickname: "SLEEPY-PILOT", pin: "0404" },
  { nickname: "CHAI-CAPTAIN", pin: "6161" },
];

/** [rating, verdict, comment] — picked deterministically per key+crew. */
const NOTES: Array<[number, string | null, string]> = [
  [5, "WORTH_IT", "Worth every rupee. Did it twice."],
  [5, "WORTH_IT", "Free — best price in the whole terminal."],
  [4, "WORTH_IT", "Cheap, cheerful, done in 15 minutes."],
  [4, null, "Good value, but the queue moves slow at peak."],
  [4, "WORTH_IT", "Bring small notes — they 'have no change'."],
  [3, null, "Fine if you're already nearby. Not worth a detour."],
  [3, "PRICEY", "Decent, but you pay terminal rent on everything."],
  [2, "PRICEY", "Two stars for the vibe, minus stars for the bill."],
  [2, "SKIP", "Skip if you're tight on time — 25 min wait."],
  [5, "WORTH_IT", "The staff pick is the right answer. Always."],
  [4, null, "Cost me more than planned, zero regrets anyway."],
  [5, null, "Do this before anything else on the board."],
];

function pick(key: string, crewIdx: number) {
  let h = 0;
  const s = `${key}#${crewIdx}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  const n = Math.abs(h);
  return NOTES[n % NOTES.length];
}

async function login(c: SeedCrew): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: c.nickname, pin: c.pin }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`login failed for ${c.nickname}: ${data.error}`);
  return data.traveler.id as string;
}

async function postReview(args: {
  travelerId: string;
  title: string;
  location: string;
  rating: number;
  verdict: string | null;
  comment: string;
}) {
  const res = await fetch(`${BASE}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`review failed for "${args.title}": ${data.error}`);
}

async function main() {
  // Collect every demo task (dedup by key) from all demo plan families.
  const tasks = new Map<string, { title: string; location: string }>();
  const add = (m: { title: string; location: string }) => {
    tasks.set(missionKeyOf(m.title, m.location), { title: m.title, location: m.location });
  };
  for (const plan of Object.values(DEMO_PLANS)) plan.missions.forEach(add);
  for (const plan of Object.values(ROAD_DEMO_PLANS)) plan.missions.forEach(add);
  for (const plan of Object.values(WHEELS_DEMO_JOURNEYS)) plan.missions.forEach(add);
  genericDemoPlan("ZZZ", "Anytown", "Anywhere", "explorer").missions.forEach(add);
  genericRoadPlan("ZZZ", "Anytown", "Anywhere", "explorer").missions.forEach(add);
  genericWheelsPlan("ZZZ", "Anytown", "Anywhere", "explorer", "bus").missions.forEach(add);

  console.log(`Seeding verdicts for ${tasks.size} demo tasks from ${CREW.length} crew…`);

  const travelerIds: string[] = [];
  for (const c of CREW) travelerIds.push(await login(c));
  console.log("Crew logged in:", CREW.map((c) => c.nickname).join(", "));

  let n = 0;
  for (const [key, task] of tasks) {
    // 3–6 reviewers per task, deterministic subset.
    const reviewerCount = 3 + (Math.abs(key.length * 7) % 4);
    for (let i = 0; i < reviewerCount; i++) {
      const crewIdx = (key.length + i * 3) % CREW.length;
      const [rating, verdict, comment] = pick(key, crewIdx);
      await postReview({
        travelerId: travelerIds[crewIdx],
        title: task.title,
        location: task.location,
        rating,
        verdict,
        comment,
      });
      n++;
    }
  }
  console.log(`Done — ${n} verdicts filed across ${tasks.size} tasks.`);
}

main().catch((err) => {
  console.error("SEED FAILED:", err);
  process.exit(1);
});
