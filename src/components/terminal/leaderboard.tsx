"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plane, Bus, TrainFront, Trophy, MapPin, Award, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * THE CREW LEADERBOARD — people ranked by badges, twice over.
 *
 *   OVERALL BOARD  — every crew member ranked by total badges collected.
 *   STOP BOARD     — the same people, categorized by the stop they earned
 *                    badges at (airport gate / railway station / bus stand):
 *                    pick a stop chip → see who owns that gate tonight,
 *                    ranked by badges earned there.
 *
 * A BADGE = one stamped mission (the passport stamp you slam at the end of
 * a stage). Boards are drawn as dark machines (.board-shell token scope —
 * they stay physical in day/night like the solari and the LED); the row for
 * YOUR callsign is lamp-lit with a YOU marker. When you earn a badge the
 * stop board follows you to the gate you just played.
 */

interface CrewRow {
  nickname: string;
  trips: number;
  badges: number;
}

interface StopBoard {
  code: string;
  city: string;
  mode: string;
  vehicle: string | null;
  badges: number;
  crewCount: number;
  crew: CrewRow[];
}

function StopIcon({ mode, vehicle }: { mode: string; vehicle: string | null }) {
  if (mode === "road") {
    return vehicle === "train" ? (
      <TrainFront className="size-3.5" aria-hidden="true" />
    ) : (
      <Bus className="size-3.5" aria-hidden="true" />
    );
  }
  return <Plane className="size-3.5" aria-hidden="true" />;
}

function RankMark({ i }: { i: number }) {
  const lamp = i === 0 ? "bg-primary text-[#0e0f12]" : i < 3 ? "text-primary" : undefined;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded border border-[#f2eee3]/15 font-mono text-[10px] font-bold",
        lamp,
      )}
    >
      {i < 3 ? "✦" : String(i + 1).padStart(2, "0")}
    </span>
  );
}

export function Leaderboard({
  refreshKey = 0,
  crewNickname,
}: {
  refreshKey?: number;
  crewNickname?: string | null;
}) {
  const [overall, setOverall] = useState<CrewRow[] | null>(null);
  const [locations, setLocations] = useState<StopBoard[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // true right after a badge lands (or on first paint) — the stop board then
  // follows the logged-in crew to the gate they just played
  const followRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) return;
      const stops: StopBoard[] = data.locations ?? [];
      setOverall(data.overall);
      setLocations(stops);

      const follow = followRef.current;
      followRef.current = false;
      setSelected((prev) => {
        if (follow && crewNickname) {
          const mine = stops.filter((l) => l.crew.some((c) => c.nickname === crewNickname));
          if (mine.length > 0) {
            const badgesAt = (l: StopBoard) =>
              l.crew.find((c) => c.nickname === crewNickname)?.badges ?? 0;
            return mine.reduce((best, l) => (badgesAt(l) > badgesAt(best) ? l : best)).code;
          }
        }
        if (prev && stops.some((l) => l.code === prev)) return prev;
        return stops[0]?.code ?? null;
      });
    } catch {
      /* boards keep their last frame — decorative until the wire heals */
    }
  }, [crewNickname]);

  // kick immediately (initial load + every refreshKey bump), then stay live
  // with a gentle poll so the boards move while judges stamp around the hall
  useEffect(() => {
    followRef.current = true;
    const kick = setTimeout(() => void load(), 0);
    const t = setInterval(() => void load(), 25_000);
    return () => {
      clearTimeout(kick);
      clearInterval(t);
    };
  }, [load, refreshKey]);

  const active = locations?.find((l) => l.code === selected) ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* ── OVERALL BOARD ── */}
      <div
        className="board-shell rounded-xl bg-[#0e0f12] p-4 shadow-xl sm:p-5"
        role="region"
        aria-label="Overall leaderboard — crew ranked by total badges collected"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="board-glow flex items-center gap-2 font-mono text-xs font-bold tracking-[0.3em] text-primary">
            <Trophy className="size-4" aria-hidden="true" />
            OVERALL LEADERBOARD
          </h3>
          <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">CREW BY BADGES</span>
        </div>

        {overall === null ? (
          <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-muted-foreground" role="status">
            READING THE PAPERS…
          </p>
        ) : overall.length === 0 ? (
          <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-[0.14em] text-muted-foreground">
            THE BOARD IS EMPTY — LOG IN AT THE CREW GATE, STAMP A MISSION, CLAIM RANK 01.
          </p>
        ) : (
          <ol className="mt-4 max-h-80 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin" aria-label="Crew ranked by total badges">
            {overall.map((row, i) => {
              const you = crewNickname && row.nickname === crewNickname;
              return (
                <li
                  key={row.nickname}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-2.5 py-2 transition-colors",
                    you
                      ? "border-primary/70 bg-primary/10 shadow-[0_0_12px_rgba(245,166,35,0.15)]"
                      : "border-[#f2eee3]/10 hover:border-primary/40",
                  )}
                >
                  <RankMark i={i} />
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate font-mono text-sm font-bold text-foreground">
                      {row.nickname.toUpperCase()}
                    </span>
                    {you && (
                      <span className="shrink-0 rounded bg-primary px-1 py-0.5 font-mono text-[8px] font-bold tracking-widest text-[#0e0f12]">
                        YOU
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 font-mono text-[9px] tracking-widest text-muted-foreground">
                    <span title={`${row.trips} trips filed`}>{row.trips} TRIPS</span>
                    <span className="flex items-center gap-1 text-base font-bold text-primary" aria-label={`${row.badges} badges`}>
                      <Award className="size-3.5" aria-hidden="true" />
                      {row.badges}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* ── STOP BOARD — people categorized by the gate they played ── */}
      <div
        className="board-shell rounded-xl bg-[#0e0f12] p-4 shadow-xl sm:p-5"
        role="region"
        aria-label="Stop leaderboard — crew ranked by badges earned at a chosen airport, railway station or bus stand"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="board-glow flex items-center gap-2 font-mono text-xs font-bold tracking-[0.3em] text-primary">
            <MapPin className="size-4" aria-hidden="true" />
            STOP LEADERBOARD
          </h3>
          <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
            PEOPLE BY BADGES
          </span>
        </div>

        {locations === null ? (
          <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-muted-foreground" role="status">
            READING THE PAPERS…
          </p>
        ) : locations.length === 0 ? (
          <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-[0.14em] text-muted-foreground">
            NO STOPS ON THE BOARD YET — LOG IN, PLAN A LAYOVER, SLAM THE FIRST STAMP.
          </p>
        ) : (
          <>
            {/* gate selector — one chip per stop that has badges on it */}
            <div
              className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
              role="tablist"
              aria-label="Choose a stop to rank its crew"
            >
              {locations.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  role="tab"
                  aria-selected={selected === l.code}
                  onClick={() => setSelected(l.code)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded border px-2 py-1 font-mono text-[10px] font-bold tracking-widest transition-colors",
                    selected === l.code
                      ? "border-primary/70 bg-primary/15 text-primary"
                      : "border-[#f2eee3]/15 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <StopIcon mode={l.mode} vehicle={l.vehicle} />
                  {l.code}
                  <span className="text-[9px] font-normal opacity-70">{l.badges}✦</span>
                </button>
              ))}
            </div>

            {active && (
              <p className="mt-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                <span className="flex items-center gap-1 text-primary">
                  <StopIcon mode={active.mode} vehicle={active.vehicle} />
                  {active.code}
                </span>
                <span className="truncate">{active.city.toUpperCase()}</span>
                <span className="flex items-center gap-1" title={`${active.crewCount} crew played here`}>
                  <Users className="size-3" aria-hidden="true" />
                  {active.crewCount}
                </span>
                <span>{active.badges}✦ HERE</span>
              </p>
            )}

            {active && active.crew.length === 0 ? (
              <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-[0.14em] text-muted-foreground">
                NOBODY HAS STAMPED AT THIS GATE YET.
              </p>
            ) : (
              active && (
                <ol
                  className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin"
                  aria-label={`Crew ranked by badges earned at ${active.code}`}
                >
                  {active.crew.map((row, i) => {
                    const you = crewNickname && row.nickname === crewNickname;
                    return (
                      <li
                        key={row.nickname}
                        className={cn(
                          "flex items-center gap-3 rounded-md border px-2.5 py-2 transition-colors",
                          you
                            ? "border-primary/70 bg-primary/10 shadow-[0_0_12px_rgba(245,166,35,0.15)]"
                            : "border-[#f2eee3]/10 hover:border-primary/40",
                        )}
                      >
                        <RankMark i={i} />
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="truncate font-mono text-sm font-bold text-foreground">
                            {row.nickname.toUpperCase()}
                          </span>
                          {you && (
                            <span className="shrink-0 rounded bg-primary px-1 py-0.5 font-mono text-[8px] font-bold tracking-widest text-[#0e0f12]">
                              YOU
                            </span>
                          )}
                        </span>
                        <span className="flex shrink-0 items-center gap-3 font-mono text-[9px] tracking-widest text-muted-foreground">
                          <span title={`${row.trips} trips at this stop`}>{row.trips} HERE</span>
                          <span
                            className="flex items-center gap-1 text-base font-bold text-primary"
                            aria-label={`${row.badges} badges earned at this stop`}
                          >
                            <Award className="size-3.5" aria-hidden="true" />
                            {row.badges}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
