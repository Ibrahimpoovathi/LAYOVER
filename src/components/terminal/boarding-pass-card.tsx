"use client";

import { useMemo } from "react";
import { Plane, ArrowRight, Infinity as InfinityIcon, Accessibility } from "lucide-react";
import {
  ACCESS_PROFILE_META,
  CATEGORY_META,
  fmtDuration,
  walkTotalM,
  type MissionCategory,
  type Plan,
} from "@/lib/plan-schema";
import { MissionTimeline } from "./mission-timeline";
import { StampBadge } from "./stamp-badge";

/**
 * THE boarding pass — paper card with perforated stub, barcode, stamps.
 * This is the artifact judges photograph.
 */
export function BoardingPassCard({
  plan,
  done,
  onToggleMission,
  source = "ai",
  passTitle = "BOARDING PASS",
  passSubtitle = "LAYOVER TERMINAL",
  routeFrom = "BED",
}: {
  plan: Plan;
  done: Record<number, boolean>;
  onToggleMission: (index: number) => void;
  source?: string;
  passTitle?: string;
  passSubtitle?: string;
  routeFrom?: string;
}) {
  // deterministic pass id from plan content (SSR-safe, no effects)
  const passId = useMemo(() => {
    const s = `${plan.airport.iata}:${plan.adventureTitle}`;
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    const code = Math.abs(h).toString(36).slice(0, 4).toUpperCase().padEnd(4, "X");
    return `LYO-${code}`;
  }, [plan]);

  const allDone = plan.missions.length > 0 && plan.missions.every((_, i) => done[i]);

  // EVERY BODY BOARDS — the IATA SSR code this pass was designed around
  const access = ACCESS_PROFILE_META[plan.accessProfile ?? "none"];
  const accessActive = plan.accessProfile != null && plan.accessProfile !== "none";

  const earnedCats = plan.missions
    .map((m, i) => (done[i] ? (m.category as MissionCategory) : null))
    .filter(Boolean) as MissionCategory[];

  const uniqueStamps = Array.from(new Set(earnedCats));

  return (
    <article
      className="pass-enter relative mx-auto w-full max-w-3xl select-none"
      aria-label={`Adventure pass for ${plan.airport.city}`}
    >
      <div className="flex flex-col lg:flex-row rounded-xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] ring-1 ring-black/40">
        {/* ── MAIN SECTION ── */}
        <div className="relative flex-1 bg-paper text-ink p-5 sm:p-7">
          {/* faint print texture */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(23,21,15,0.03) 0px, rgba(23,21,15,0.03) 1px, transparent 1px, transparent 4px)",
            }}
          />

          <header className="relative flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink/20 pb-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.35em] text-ink/60">
                {passTitle}
              </p>
              <p className="font-mono text-[11px] font-bold tracking-widest">
                {passId} · {passSubtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {source === "demo" && (
                <span className="font-mono text-[9px] font-bold tracking-widest px-2 py-1 rounded bg-[#8a6d3b]/15 text-[#8a6d3b] border border-[#8a6d3b]/40">
                  TRAINING MODE
                </span>
              )}
              <span
                className={`font-mono text-[9px] font-bold tracking-widest px-2 py-1 rounded ${
                  allDone
                    ? "bg-[#2d7d74] text-[#f4efe4]"
                    : "bg-ink text-paper blink-slow"
                }`}
              >
                {allDone ? "MISSION CLEAR" : "ACTIVE"}
              </span>
            </div>
          </header>

          {/* route row */}
          <div className="relative mt-5 flex items-center gap-3 sm:gap-5">
            <div className="text-left">
              <p className="font-mono text-4xl sm:text-5xl font-bold tracking-tight leading-none">
                {routeFrom}
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-[0.25em] text-ink/50">
                YOUR CURRENT SPOT
              </p>
            </div>

            <div className="relative flex-1 flex items-center" aria-hidden="true">
              <span className="h-px flex-1 border-t-2 border-dashed border-ink/40" />
              <span className="mx-1 flex size-9 items-center justify-center rounded-full bg-ink text-paper">
                <Plane className="size-4 rotate-90" />
              </span>
              <span className="h-px flex-1 border-t-2 border-dashed border-ink/40" />
              <ArrowRight className="ml-1 size-4 text-ink/60" />
            </div>

            <div className="text-right">
              <p className="font-mono text-4xl sm:text-5xl font-bold tracking-tight leading-none text-[#c2452d]">
                {plan.airport.iata}
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-[0.25em] text-ink/50 uppercase">
                {plan.airport.city}
                {plan.airport.country ? `, ${plan.airport.country}` : ""}
              </p>
            </div>
          </div>

          {/* meta chips */}
          <div className="mt-5 grid grid-cols-2 gap-2 font-mono text-center sm:grid-cols-4">
            <div className="rounded border border-ink/25 px-2 py-1.5">
              <p className="text-[9px] tracking-[0.2em] text-ink/50">WINDOW</p>
              <p className="text-sm font-bold">{fmtDuration(plan.totalDurationMin)}</p>
            </div>
            <div className="rounded border border-ink/25 px-2 py-1.5">
              <p className="text-[9px] tracking-[0.2em] text-ink/50">VIBE</p>
              <p className="text-sm font-bold uppercase">{plan.vibe}</p>
            </div>
            <div className="rounded border border-ink/25 px-2 py-1.5">
              <p className="text-[9px] tracking-[0.2em] text-ink/50">SEC. BUFFER</p>
              <p className="text-sm font-bold">{fmtDuration(plan.bufferMin)}</p>
            </div>
            <div
              className={`rounded border px-2 py-1.5 ${accessActive ? "border-[#2d7d74]/60 bg-[#2d7d74]/10" : "border-ink/25"}`}
              title={accessActive ? access.hint : "No assistance code on this pass"}
            >
              <p className="text-[9px] tracking-[0.2em] text-ink/50">ACCESS · SSR</p>
              {accessActive ? (
                <p className="text-sm font-bold text-[#2d7d74]">
                  <Accessibility className="mr-0.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
                  {access.ssr}
                </p>
              ) : (
                <p className="text-sm font-bold text-ink/30">—</p>
              )}
            </div>
          </div>
          {accessActive && (
            <p className="mt-2 text-center font-mono text-[9px] tracking-[0.25em] text-ink/50">
              {plan.accessProfile === "deaf"
                ? "VISUAL-FIRST MISSIONS · EVERY ANNOUNCEMENT CAPTIONED"
                : `TOTAL ROLL ≈ ${walkTotalM(plan)} M · ALL MISSIONS STEP-FREE${
                    plan.accessProfile === "dpna" ? " · QUIET ROUTE" : ""
                  }`}
            </p>
          )}

          {/* missions */}
          <div className="relative mt-6 border-t-2 border-dashed border-ink/25 pt-4">
            <p className="font-mono text-[10px] tracking-[0.3em] text-ink/50 mb-3">
              MISSION MANIFEST — {plan.missions.length} OBJECTIVES
            </p>
            <MissionTimeline plan={plan} done={done} onToggle={onToggleMission} light />
          </div>
        </div>

        {/* ── PERFORATION ── */}
        <div className="relative lg:w-0" aria-hidden="true">
          {/* vertical perforation on lg */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-0 w-0 -translate-x-1/2">
            <span className="notch -top-3 -left-3" />
            <span className="notch -bottom-3 -left-3" />
          </div>
          <div className="hidden lg:block perforation-v absolute top-2 bottom-2 -left-[7px] w-3.5" />
          {/* horizontal perforation on mobile */}
          <div className="lg:hidden h-0 relative" />
        </div>

        {/* ── STUB ── */}
        <div className="relative lg:w-[248px] shrink-0 bg-paper text-ink border-t-2 border-dashed border-ink/30 lg:border-t-0 lg:border-l-2 lg:border-dashed p-5 flex flex-col">
          <div className="hidden lg:block">
            <span className="notch -top-3 -right-3" />
            <span className="notch -bottom-3 -right-3" />
          </div>
          <div className="lg:hidden perforation-h absolute -top-[7px] left-2 right-2 h-3.5" />

          <p className="font-mono text-[9px] tracking-[0.3em] text-ink/50">ADVENTURE</p>
          <h3 className="mt-1 font-semibold leading-tight text-lg" style={{ fontFamily: "var(--font-sora)" }}>
            {plan.adventureTitle}
          </h3>

          <p className="mt-3 text-[12px] leading-relaxed text-ink/70 italic">
            “{plan.funFact}”
          </p>

          {/* stamps */}
          <div className="mt-4 flex-1">
            <p className="font-mono text-[9px] tracking-[0.3em] text-ink/50 mb-2">
              PASSPORT STAMPS
            </p>
            <div className="flex flex-wrap gap-2">
              {plan.missions.map((m, i) => (
                <StampBadge
                  key={i}
                  category={(m.category as MissionCategory) ?? "chill"}
                  earned={!!done[i]}
                  index={i}
                  size={66}
                  animate={!!done[i]}
                />
              ))}
            </div>
            {uniqueStamps.length === plan.missions.length && plan.missions.length > 0 && (
              <p className="mt-2 font-mono text-[10px] font-bold tracking-widest text-[#2d7d74]">
                ✦ PERFECT RUN — {plan.missions.length}/{plan.missions.length} CLEARED
              </p>
            )}
          </div>

          {/* barcode + qr */}
          <div className="mt-4 space-y-3">
            <div className="flex items-end gap-3">
              <div className="barcode h-10 flex-1 rounded-sm" aria-hidden="true" />
              <div className="qr-blocks size-10 rounded-sm border-2 border-ink/70 p-[3px]" aria-hidden="true" />
            </div>
            <div className="flex items-center justify-between font-mono text-[9px] tracking-widest text-ink/50">
              <span>{passId}</span>
              <span className="flex items-center gap-1">
                GATE <InfinityIcon className="size-3" /> · SEQ {plan.missions.length}0{plan.bufferMin % 10}
                {accessActive && ` · SSR ${access.ssr}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
