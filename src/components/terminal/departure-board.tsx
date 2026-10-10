"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Split-flap departure board — the LAYOVER hero.
 * Each character is a mechanical flap cell that flips when its target changes,
 * staggered left-to-right like a real solari board.
 */

function FlapCell({
  char,
  delay,
  className = "",
}: {
  char: string;
  delay: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(char);
  const [flipping, setFlipping] = useState(false);
  const prev = useRef(char);

  useEffect(() => {
    if (prev.current === char) return;
    let t2: ReturnType<typeof setTimeout> | undefined;
    const t1 = setTimeout(() => {
      setFlipping(true);
      t2 = setTimeout(() => {
        setDisplay(char);
        prev.current = char;
        setFlipping(false);
      }, 60);
    }, delay);
    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [char, delay]);

  return (
    <span
      aria-hidden="true"
      className={`flap-cell ${flipping ? "flipping" : ""} ${className}`}
    >
      <span className="flap-face">{display === " " ? "\u00A0" : display}</span>
    </span>
  );
}

export function SplitFlapText({
  text,
  className = "",
  cellClassName = "",
  staggerMs = 26,
}: {
  text: string;
  className?: string;
  cellClassName?: string;
  staggerMs?: number;
}) {
  const chars = text.split("");
  return (
    <span className={`inline-flex ${className}`} role="heading" aria-level={1} aria-label={text}>
      {chars.map((c, i) => (
        <FlapCell key={i} char={c} delay={i * staggerMs} className={cellClassName} />
      ))}
    </span>
  );
}

export interface BoardRow {
  code: string;
  dest: string;
  info: string;
  status: string;
  tone?: "amber" | "green" | "red";
}

const TONE_CLASSES: Record<string, string> = {
  amber: "text-primary board-glow",
  green: "text-[#5fbf85] board-glow",
  red: "text-[#e5484d] board-glow",
};

/**
 * Full departures table: code / destination flap columns + status column.
 * Cycles through its row sets every cycleMs for continuous motion.
 */
export function DepartureBoard({
  rows,
  cycleMs = 7000,
  className = "",
  firstColLabel = "FLIGHT",
}: {
  rows: BoardRow[];
  cycleMs?: number;
  className?: string;
  firstColLabel?: string;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), cycleMs);
    return () => clearInterval(id);
  }, [cycleMs]);

  // rotate rows so every cycle brings new flap movement
  const view = rows.map((_, i) => rows[(i + tick) % rows.length]);

  return (
    <div
      className={`board-shell relative rounded-xl border border-white/10 bg-[#0e0f12] p-4 sm:p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] ${className}`}
    >
      {/* scanlines */}
      <div className="scanlines pointer-events-none absolute inset-0 rounded-xl opacity-60" />
      <div className="relative space-y-2.5 sm:space-y-3">
        <div className="hidden sm:grid grid-cols-[110px_1fr_150px_120px] gap-4 text-[10px] tracking-[0.3em] text-muted-foreground/70 font-mono px-1 pb-1">
          <span>{firstColLabel}</span>
          <span>DESTINATION</span>
          <span>REMARKS</span>
          <span className="text-right">STATUS</span>
        </div>
        {view.map((r, i) => (
          <div
            key={`${r.code}-${i}`}
            className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[110px_1fr_150px_120px] items-center gap-3 sm:gap-4"
          >
            <SplitFlapText
              text={r.code.padEnd(6, " ")}
              staggerMs={18}
              cellClassName="w-[0.78em] h-[1.2em] text-[13px] sm:text-[15px] font-mono font-bold"
              className="gap-[3px]"
            />
            <SplitFlapText
              text={r.dest.toUpperCase().padEnd(16, " ")}
              staggerMs={14}
              cellClassName="w-[0.78em] h-[1.2em] text-[13px] sm:text-[15px] font-mono font-bold"
              className="gap-[3px] overflow-hidden"
            />
            <span className="hidden sm:block font-mono text-[13px] text-foreground/70 truncate">
              {r.info}
            </span>
            <span
              className={`font-mono text-[12px] sm:text-[13px] font-bold tracking-widest text-right ${TONE_CLASSES[r.tone ?? "amber"]}`}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
