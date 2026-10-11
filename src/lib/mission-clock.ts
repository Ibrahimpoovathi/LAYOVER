import { missionStarts, type Plan } from "@/lib/plan-schema";

/**
 * USP-A — "OUR BOARD DEFENDS YOUR TIME"
 *
 * A deterministic demo clock: no scattered Date.now(), one source of truth.
 * While a plan is on the board, the clock advances journey minutes at a fixed
 * sim rate. Every mission owns a WINDOW (start → end in journey minutes).
 * Ignore a mission past its window + grace → the solari flips it to SCRUBBED
 * and REPLAN refills the time you have left. The board defends the schedule;
 * the traveller keeps the wins they stamped.
 */

/** Journey minutes advanced per real second while the demo clock runs. */
export const SIM_RATE = 3;

/** Journey minutes past a window's end before the board scrubs the mission. */
export const SCRUB_GRACE_MIN = 10;

/** Journey minutes before a window closes that the board cries FINAL CALL. */
export const FINAL_CALL_MIN = 10;

export interface MissionWindow {
  start: number;
  end: number;
}

/**
 * Windows for every mission, from the anchor-aware missionStarts schedule
 * (replanned plans anchor at the clock's current minute — windows stay honest).
 */
export function missionWindows(plan: Plan): MissionWindow[] {
  const { starts, ends } = missionStarts(plan);
  return plan.missions.map((_, i) => ({ start: starts[i], end: ends[i] }));
}

export type MissionPhase = "upcoming" | "active" | "finalcall" | "scrubbed" | "done";

export function missionPhase(
  win: MissionWindow,
  clockMin: number,
  isDone: boolean,
): MissionPhase {
  if (isDone) return "done";
  if (clockMin > win.end + SCRUB_GRACE_MIN) return "scrubbed";
  if (clockMin < win.start) return "upcoming";
  if (clockMin >= win.end - FINAL_CALL_MIN) return "finalcall";
  return "active";
}

/** Journey minutes as the board prints them: T+02:35. */
export function fmtJourneyClock(min: number): string {
  const m = Math.max(0, Math.round(min));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Status text + tone for the solari row of a mission. */
export function missionBoardStatus(
  phase: MissionPhase,
): { status: string; tone: "amber" | "green" | "red" } {
  switch (phase) {
    case "done":
      return { status: "DONE ✦", tone: "green" };
    case "active":
      return { status: "BOARDING", tone: "green" };
    case "finalcall":
      return { status: "FINAL CALL", tone: "red" };
    case "scrubbed":
      return { status: "SCRUBBED", tone: "red" };
    default:
      return { status: "ON TIME", tone: "amber" };
  }
}
