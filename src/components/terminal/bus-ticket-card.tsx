"use client";

import { useMemo } from "react";
import { ArrowRight, Bus, Check, Lightbulb, MapPin, TrainFront, Accessibility } from "lucide-react";
import {
  ACCESS_PROFILE_META,
  CATEGORY_META,
  fmtDuration,
  missionOffsets,
  VEHICLE_META,
  type MissionCategory,
  type Plan,
  type VehicleId,
} from "@/lib/plan-schema";
import { StampBadge } from "./stamp-badge";

/** Local T+ clock — same pattern as mission-timeline.tsx (T+HH:MM, zero-padded). */
function fmtClock(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * THE old bus ticket — the WHEELS mode artifact (bus + train).
 * Vintage conductor's ticket: cream paper, red ink, torn perforations,
 * one punch-hole per journey stage. Air-mode twin: BoardingPassCard.
 * This is the artifact judges photograph.
 */
export function BusTicketCard({
  plan,
  done,
  onToggleMission,
  source = "ai",
}: {
  plan: Plan;
  done: Record<number, boolean>;
  onToggleMission: (index: number) => void;
  source?: string;
}) {
  const vehicle: VehicleId = plan.vehicle ?? "bus";
  const origin = plan.airport.city;
  const dest = plan.destination?.city ?? "& BACK";
  const band = VEHICLE_META[vehicle].ticketBand;
  const fare = plan.fareJoke ?? VEHICLE_META[vehicle].fare;
  const vehicleLabel = `${VEHICLE_META[vehicle].label} · ${vehicle === "train" ? "EXPRESS" : "CLASSIC"}`;
  const VehicleIcon = vehicle === "train" ? TrainFront : Bus;

  // deterministic ticket id + serial from plan content (SSR-safe, no effects)
  const { ticketId, serial } = useMemo(() => {
    const s = `${plan.airport.iata}:${plan.adventureTitle}`;
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    const code = Math.abs(h).toString(36).slice(0, 4).toUpperCase().padEnd(4, "X");
    return {
      ticketId: `TK-${code}`,
      serial: String(Math.abs(h) % 1000000).padStart(6, "0"),
    };
  }, [plan]);

  const offsets = missionOffsets(plan);
  const allDone = plan.missions.length > 0 && plan.missions.every((_, i) => done[i]);

  // EVERY BODY BOARDS — the IATA SSR code this ticket was designed around
  const access = ACCESS_PROFILE_META[plan.accessProfile ?? "none"];
  const accessActive = plan.accessProfile != null && plan.accessProfile !== "none";

  return (
    <article
      className="ticket-enter relative mx-auto w-full max-w-4xl select-none"
      aria-label={`Journey ticket from ${origin} to ${dest}`}
    >
      <div className="flex flex-col overflow-hidden rounded-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] ring-1 ring-black/40 lg:flex-row">
        {/* ── LEFT STUB — ADMIT ONE ── */}
        <div className="shrink-0 border-b-2 border-dashed border-[#17150f]/30 bg-paper text-ink lg:flex lg:w-[120px] lg:flex-col lg:items-center lg:justify-between lg:border-b-0 lg:py-5">
          {/* mobile: single horizontal strip */}
          <div className="flex w-full items-center justify-between gap-2 px-4 py-3 lg:hidden">
            <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-[#B3331F]">
              ADMIT ONE
            </span>
            <span className="font-mono text-lg font-bold tracking-wider">{serial}</span>
            <span
              aria-hidden="true"
              className="size-6 shrink-0 rounded-full border-2 border-dashed border-[#B3331F]/60 bg-background"
            />
            <span className="font-mono text-[8px] tracking-[0.2em] text-[#17150f]/50">
              WHEELS DIVISION
            </span>
          </div>

          {/* lg: vertical stub column */}
          <p className="hidden rotate-180 font-mono text-[11px] font-bold tracking-[0.4em] text-[#B3331F] [writing-mode:vertical-rl] lg:block">
            ADMIT ONE
          </p>
          <div className="hidden flex-col items-center gap-2.5 lg:flex">
            <span className="font-mono text-2xl font-bold tracking-wider">{serial}</span>
            <span
              aria-hidden="true"
              className="size-6 rounded-full border-2 border-dashed border-[#B3331F]/60 bg-background"
            />
          </div>
          <p className="hidden text-center font-mono text-[8px] tracking-[0.2em] text-[#17150f]/50 lg:block">
            WHEELS DIVISION
          </p>
          <div className="hidden text-center lg:block">
            <p className="font-mono text-[8px] tracking-[0.3em] text-[#17150f]/50">TK NO.</p>
            <p className="mt-0.5 font-mono text-[10px] font-bold tracking-widest">{ticketId}</p>
          </div>
        </div>

        {/* ── PERFORATION — tear line between stub and body ── */}
        <div className="relative lg:w-0" aria-hidden="true">
          {/* vertical tear + punched notches on lg */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-0 w-0 -translate-x-1/2">
            <span className="notch -top-3 -left-3" />
            <span className="notch -bottom-3 -left-3" />
          </div>
          <div className="hidden lg:block perforation-v absolute top-2 bottom-2 -left-[7px] w-3.5" />
        </div>

        {/* ── BODY ── */}
        <div className="relative min-w-0 flex-1 bg-paper p-5 text-ink sm:p-7">
          {/* faint print texture */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(23,21,15,0.03) 0px, rgba(23,21,15,0.03) 1px, transparent 1px, transparent 4px)",
            }}
          />
          {/* mobile tear line under the stub */}
          <div
            aria-hidden="true"
            className="perforation-h absolute -top-[7px] left-2 right-2 h-3.5 lg:hidden"
          />

          {/* red issue band */}
          <div className="relative flex flex-wrap items-center justify-between gap-2 rounded-sm bg-[#B3331F] px-3 py-1.5 text-[#f4efe4]">
            <p className="min-w-0 font-mono text-[10px] tracking-[0.3em]">{band}</p>
            {(source === "demo" || source === "showcase") && (
              <span className="shrink-0 rounded border border-[#f4efe4]/50 bg-[#17150f]/30 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest">
                {source === "showcase" ? "ZERO-SPEND PRESS" : "TRAINING MODE"}
              </span>
            )}
          </div>

          {/* route row — big stop codes, city captions (fits 3-col ticket width) */}
          <div className="relative mt-4 flex items-center gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="font-mono text-3xl font-bold uppercase leading-none sm:text-4xl">{plan.airport.iata}</p>
              <p className="mt-1 truncate font-mono text-[9px] tracking-[0.2em] text-[#17150f]/50 uppercase">
                {origin}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 items-center" aria-hidden="true">
              <span className="h-px flex-1 border-t-2 border-dashed border-[#17150f]/40" />
              <span className="mx-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#17150f] text-[#f4efe4]">
                <VehicleIcon className="size-4" />
              </span>
              <span className="h-px flex-1 border-t-2 border-dashed border-[#17150f]/40" />
              <ArrowRight className="ml-1 size-4 shrink-0 text-[#17150f]/60" />
            </div>
            <div className="min-w-0 text-right">
              <p className="font-mono text-3xl font-bold uppercase leading-none text-[#B3331F] sm:text-4xl">
                {plan.destination?.code ?? "& BKG"}
              </p>
              <p className="mt-1 truncate font-mono text-[9px] tracking-[0.2em] text-[#17150f]/50 uppercase">
                {dest}
              </p>
            </div>
          </div>

          {/* route code + adventure title */}
          <div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            {plan.routeCode && (
              <span className="rounded border border-[#B3331F]/40 bg-[#B3331F]/10 px-2 py-1 font-mono text-[10px] tracking-[0.25em] text-[#B3331F]">
                ROUTE {plan.routeCode}
              </span>
            )}
            {accessActive && (
              <span
                className="flex items-center gap-1 rounded border border-[#2d7d74]/50 bg-[#2d7d74]/10 px-2 py-1 font-mono text-[10px] font-bold tracking-[0.25em] text-[#2d7d74]"
                title={access.hint}
              >
                <Accessibility className="size-3.5" aria-hidden="true" />
                SSR {access.ssr}
              </span>
            )}
            <h3
              className="text-lg font-semibold leading-tight"
              style={{ fontFamily: "var(--font-sora)" }}
            >
              {plan.adventureTitle}
            </h3>
          </div>

          {/* meta grid — always 2×2 inside the narrow ticket body */}
          <div className="relative mt-4 grid grid-cols-2 gap-2 font-mono sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded border border-[#17150f]/25 px-2 py-1.5">
              <p className="text-[9px] tracking-[0.2em] text-[#6f6a5c]">DATE</p>
              <p className="text-[10px] font-bold leading-tight">10-11 OCT · NIGHT</p>
            </div>
            <div className="rounded border border-[#17150f]/25 px-2 py-1.5">
              <p className="text-[9px] tracking-[0.2em] text-[#6f6a5c]">VEHICLE</p>
              <p className="text-[10px] font-bold leading-tight">{vehicleLabel}</p>
            </div>
            <div className="rounded border border-[#17150f]/25 px-2 py-1.5">
              <p className="text-[9px] tracking-[0.2em] text-[#6f6a5c]">WINDOW</p>
              <p className="text-[10px] font-bold leading-tight">
                {fmtDuration(plan.totalDurationMin)}
              </p>
            </div>
            <div className="rounded border border-[#17150f]/25 px-2 py-1.5">
              <p className="text-[9px] tracking-[0.2em] text-[#6f6a5c]">FARE</p>
              <p className="truncate text-[10px] font-bold leading-tight" title={fare}>
                {fare}
              </p>
            </div>
            <div
              className={`rounded border px-2 py-1.5 ${
                accessActive ? "border-[#2d7d74]/50 bg-[#2d7d74]/10" : "border-[#17150f]/25"
              }`}
              title={accessActive ? access.hint : "No assistance code on this ticket"}
            >
              <p className="text-[9px] tracking-[0.2em] text-[#6f6a5c]">ACCESS · SSR</p>
              <p
                className={`text-[10px] font-bold leading-tight ${
                  accessActive ? "text-[#2d7d74]" : "text-[#17150f]/30"
                }`}
              >
                {accessActive ? access.ssr : "—"}
              </p>
            </div>
          </div>

          {/* journey stages — the conductor punches these */}
          <div className="relative mt-5 border-t-2 border-dashed border-[#17150f]/25 pt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] tracking-[0.3em] text-[#17150f]/60">
                JOURNEY STAGES — TAP TO PUNCH
              </p>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest ${
                  allDone ? "bg-[#2d7d74] text-[#f4efe4]" : "bg-[#17150f] text-[#f4efe4] blink-slow"
                }`}
              >
                {allDone ? "MISSION CLEAR" : "ACTIVE"}
              </span>
            </div>

            <ol aria-label="Journey stages">
              {plan.missions.map((m, i) => {
                const meta = CATEGORY_META[m.category as MissionCategory] ?? CATEGORY_META.chill;
                const isDone = !!done[i];
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3 border-b border-dashed border-[#17150f]/15 py-2.5 last:border-0"
                  >
                    {/* conductor punch — a hole torn through the paper when done */}
                    <button
                      type="button"
                      onClick={() => onToggleMission(i)}
                      aria-pressed={isDone}
                      aria-label={`${isDone ? "Undo punch" : "Punch"} stage ${i + 1}: ${m.title}`}
                      className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90 min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 ${
                        isDone
                          ? "border-[#B3331F] bg-background"
                          : "border-[#17150f]/35 bg-transparent hover:border-[#B3331F]"
                      }`}
                    >
                      {isDone ? (
                        <span className="punch-pop" aria-hidden="true">
                          <Check className="size-4 text-[#B3331F]" strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span aria-hidden="true" className="size-2 rounded-full bg-[#17150f]/25" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[9px] font-bold tracking-widest text-[#B3331F]">
                          STAGE {i + 1}
                        </span>
                        <span
                          className="rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest opacity-90"
                          style={{ color: meta.ink, borderColor: meta.ring }}
                        >
                          {meta.label}
                        </span>
                        <span className="font-mono text-[10px] text-[#6f6a5c]">
                          · {fmtDuration(m.durationMin)}
                        </span>
                        <span className="font-mono text-[9px] text-[#6f6a5c]">
                          T+{fmtClock(offsets[i])}
                        </span>
                        {/* EVERY BODY BOARDS — access chips (only when the plan carries them) */}
                        {m.distanceM != null && (
                          <span className="rounded border border-[#B3331F]/40 px-1 py-0.5 font-mono text-[9px] font-bold tracking-widest text-[#B3331F]/90">
                            ≈{m.distanceM} M
                          </span>
                        )}
                        {m.stepFree && (
                          <span className="rounded border border-[#2d7d74]/50 px-1 py-0.5 font-mono text-[9px] font-bold tracking-widest text-[#2d7d74]">
                            STEP-FREE
                          </span>
                        )}
                        {m.sensory === "quiet" && (
                          <span className="rounded border border-[#2d7d74]/50 px-1 py-0.5 font-mono text-[9px] font-bold tracking-widest text-[#2d7d74]">
                            QUIET
                          </span>
                        )}
                        {m.sensory === "loud" && (
                          <span className="rounded border border-[#B3331F]/50 px-1 py-0.5 font-mono text-[9px] font-bold tracking-widest text-[#B3331F]">
                            LOUD
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-1 font-semibold leading-snug text-[#17150f] ${
                          isDone ? "line-through opacity-60" : ""
                        }`}
                      >
                        {m.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-[#6f6a5c]">{m.description}</p>
                      <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-[#6f6a5c]">
                        <MapPin className="size-3 shrink-0" aria-hidden="true" />
                        {m.location}
                      </p>
                      {m.tip && (
                        <p className="mt-1 flex items-start gap-1.5 text-[11px] italic text-[#6f6a5c]/90">
                          <Lightbulb className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                          {m.tip}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* fine print + barcode */}
          <div className="relative mt-5">
            <p className="text-[11px] italic leading-relaxed text-[#6f6a5c]">“{plan.funFact}”</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="barcode h-9 min-w-0 flex-1 rounded-sm" aria-hidden="true" />
              <div className="shrink-0 text-right font-mono text-[9px] tracking-widest text-[#17150f]/50">
                <p>{ticketId}</p>
                <p>{serial}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 font-mono text-[9px] text-[#17150f]/45">
              <span>IF LOST, THE ADVENTURE IS STILL YOURS</span>
              <span>CONDUCTOR: ____________</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — travel stamps ── */}
        <div className="relative flex shrink-0 flex-col border-t-2 border-dashed border-[#17150f]/30 bg-paper p-5 text-ink lg:w-[210px] lg:border-l-2 lg:border-t-0">
          <div className="hidden lg:block">
            <span className="notch -top-3 -right-3" />
            <span className="notch -bottom-3 -right-3" />
          </div>
          <div
            aria-hidden="true"
            className="perforation-h absolute -top-[7px] left-2 right-2 h-3.5 lg:hidden"
          />

          <p className="font-mono text-[9px] tracking-[0.3em] text-[#17150f]/50">TRAVEL STAMPS</p>
          <p className="mt-0.5 font-mono text-[9px] text-[#17150f]/40">
            YOUR TICKET IS YOUR PASSPORT
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {plan.missions.map((m, i) => (
              <StampBadge
                key={i}
                category={(m.category as MissionCategory) ?? "chill"}
                earned={!!done[i]}
                index={i}
                size={56}
                animate={!!done[i]}
              />
            ))}
          </div>

          {allDone && (
            <p className="mt-2 font-mono text-[10px] font-bold tracking-widest text-[#2d7d74]">
              ✦ PERFECT RUN — {plan.missions.length}/{plan.missions.length} CLEARED
            </p>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <p className="font-mono text-[9px] tracking-widest text-[#17150f]/45">
              FARE PAID IN CHAI
            </p>
            <div
              aria-hidden="true"
              className="qr-blocks size-10 shrink-0 rounded-sm border-2 border-[#17150f]/70 p-[3px]"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
