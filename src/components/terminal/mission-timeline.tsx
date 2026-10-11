"use client";

import { useMemo } from "react";
import {
  UtensilsCrossed,
  Compass,
  Coffee,
  Footprints,
  Armchair,
  Sparkles,
  MapPin,
  Lightbulb,
  Check,
  Clock,
  Accessibility,
  VolumeX,
  Volume2,
} from "lucide-react";
import {
  CATEGORY_META,
  fmtDuration,
  missionStarts,
  type Mission,
  type MissionCategory,
  type Plan,
} from "@/lib/plan-schema";
import { missionKeyOf } from "@/lib/review-key";
import { MissionReview, useReviewSummaries } from "./mission-reviews";

const CATEGORY_ICONS: Record<MissionCategory, React.ComponentType<{ className?: string }>> = {
  eat: UtensilsCrossed,
  explore: Compass,
  chill: Coffee,
  move: Footprints,
  weird: Sparkles,
  rest: Armchair,
};

/** EVERY BODY BOARDS — sensory-load chip ink (same palette as stamps). */
const SENSORY_META: Record<string, { label: string; ink: string; icon: React.ComponentType<{ className?: string }> }> = {
  quiet: { label: "QUIET", ink: "#2d7d74", icon: VolumeX },
  moderate: { label: "MODERATE", ink: "#8a6d3b", icon: Volume2 },
  loud: { label: "LOUD", ink: "#c2452d", icon: Volume2 },
};

function fmtClock(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Mission timeline — the heart of the pass.
 * Light=true renders ink-on-paper (inside the boarding pass);
 * light=false renders terminal style (standalone section).
 */
export function MissionTimeline({
  plan,
  done,
  onToggle,
  light = true,
  scrubbed,
  crew = null,
  missionIds = [],
}: {
  plan: Plan;
  done: Record<number, boolean>;
  onToggle: (index: number) => void;
  light?: boolean;
  /** USP-A — missions the demo clock scrubbed (window missed). Index-keyed. */
  scrubbed?: Record<number, boolean>;
  /** Logged-in crew (enables rating). null = read-only reviews. */
  crew?: { id: string; nickname: string } | null;
  /** Archived DB ids for this plan's missions (index-aligned, sparse ok). */
  missionIds?: (string | undefined)[];
}) {
  const { starts: offsets, ends: windowEnds } = missionStarts(plan);
  const textColor = light ? "text-[#17150f]" : "text-foreground";
  const subText = light ? "text-[#6f6a5c]" : "text-muted-foreground";

  // CREW REVIEWS — one bulk fetch for every row's star chip.
  const keys = useMemo(
    () => plan.missions.map((m) => missionKeyOf(m.title, m.location)),
    [plan.missions]
  );
  const { summaries, refresh } = useReviewSummaries(keys);

  return (
    <ol className="relative space-y-3" aria-label="Layover missions">
      {plan.missions.map((m, i) => {
        const meta = CATEGORY_META[m.category as MissionCategory] ?? CATEGORY_META.chill;
        const Icon = CATEGORY_ICONS[m.category as MissionCategory] ?? Compass;
        const isDone = !!done[i];
        const isScrubbed = !isDone && !!scrubbed?.[i];
        return (
          <li key={i} className={`relative pl-9 ${isScrubbed ? "opacity-55" : ""}`}>
            {/* timeline spine */}
            <span
              aria-hidden="true"
              className="absolute left-[13px] top-9 bottom-[-12px] w-px border-l border-dashed"
              style={{ borderColor: light ? "rgba(23,21,15,0.25)" : "rgba(242,238,227,0.2)" }}
            />
            {/* category node */}
            <span
              className="absolute left-0 top-1 flex size-7 items-center justify-center rounded-full border-2"
              style={{
                borderColor: meta.ring,
                backgroundColor: isDone ? meta.ring : "transparent",
                color: isDone ? "#f4efe4" : meta.ring,
              }}
            >
              {isDone ? <Check className="size-4" strokeWidth={3} /> : <Icon className="size-3.5" />}
            </span>

            <div className="group">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono text-[10px] tracking-widest ${subText}`}>
                  T+{fmtClock(offsets[i])}
                </span>
                <span
                  className="font-mono text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border"
                  style={{ color: meta.ink, borderColor: meta.ring, opacity: 0.9 }}
                >
                  {meta.label} · {fmtDuration(m.durationMin)}
                </span>
                <span className={`font-mono text-[10px] flex items-center gap-1 ${subText}`}>
                  <Clock className="size-3" aria-hidden="true" />
                  ends T+{fmtClock(windowEnds[i])}
                </span>
                {/* USP-A — the board defended your time: this window closed */}
                {isScrubbed && (
                  <span
                    className="font-mono text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border text-[#c2452d]"
                    style={{ borderColor: "#c2452d" }}
                    title="The clock ran past this window — the board scrubbed it"
                  >
                    WINDOW CLOSED · SCRUBBED
                  </span>
                )}
                {/* EVERY BODY BOARDS — access chips (only render when the plan carries them) */}
                {m.distanceM != null && (
                  <span
                    className="font-mono text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border"
                    style={{ color: meta.ink, borderColor: meta.ring, opacity: 0.85 }}
                    title="Walking / rolling distance from the previous point"
                  >
                    ≈{m.distanceM} M
                  </span>
                )}
                {m.stepFree && (
                  <span
                    className="font-mono text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border"
                    style={{ color: "#2d7d74", borderColor: "#2d7d74", opacity: 0.9 }}
                    title="Step-free route: elevator, ramp or level entrance"
                  >
                    <Accessibility className="mr-0.5 inline size-3 align-[-2px]" aria-hidden="true" />
                    STEP-FREE
                  </span>
                )}
                {m.sensory && SENSORY_META[m.sensory] && (
                  <span
                    className="font-mono text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border"
                    style={{ color: SENSORY_META[m.sensory].ink, borderColor: SENSORY_META[m.sensory].ink, opacity: 0.9 }}
                    title={`Expected sensory load: ${m.sensory}`}
                  >
                    {m.sensory.toUpperCase()}
                  </span>
                )}
                {/* CREW REVIEWS — star chip + verdict dialog */}
                <MissionReview
                  title={m.title}
                  location={m.location}
                  missionId={missionIds[i]}
                  summary={summaries[keys[i]]}
                  light={light}
                  crew={crew}
                  onPosted={refresh}
                />
              </div>

              <div className="mt-1 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`font-semibold leading-snug ${textColor} ${isDone ? "line-through opacity-60" : ""}`}
                  >
                    {m.title}
                  </p>
                  <p className={`mt-0.5 text-sm leading-relaxed ${subText}`}>{m.description}</p>
                  <p className={`mt-1.5 flex items-center gap-1.5 font-mono text-[11px] ${subText}`}>
                    <MapPin className="size-3 shrink-0" aria-hidden="true" />
                    {m.location}
                  </p>
                  {m.tip && (
                    <p
                      className={`mt-1 flex items-start gap-1.5 text-[11px] italic ${subText} opacity-90`}
                    >
                      <Lightbulb className="size-3 shrink-0 mt-0.5" aria-hidden="true" />
                      {m.tip}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onToggle(i)}
                  aria-pressed={isDone}
                  aria-label={`${isDone ? "Undo" : "Complete"} mission: ${m.title}`}
                  disabled={isScrubbed}
                  aria-disabled={isScrubbed}
                  className={`shrink-0 min-h-11 min-w-11 flex items-center justify-center rounded-md border-2 transition-all active:scale-90 ${
                    isDone
                      ? "border-transparent"
                      : light
                        ? "border-[#17150f]/30 hover:border-[#17150f] bg-transparent"
                        : "border-border hover:border-primary bg-transparent"
                  } ${isScrubbed ? "cursor-not-allowed line-through" : ""}`}
                  style={isDone ? { backgroundColor: meta.ring } : undefined}
                >
                  <Check
                    className={`size-5 ${isDone ? "text-[#f4efe4]" : light ? "text-[#17150f]/50" : "text-muted-foreground"}`}
                    strokeWidth={3}
                  />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
