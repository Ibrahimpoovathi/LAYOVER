"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { GATE_CONTROL_LINES } from "@/lib/demo-mode";

/**
 * Theatrical generation status — turns AI latency into showmanship.
 * Cycles through gate-control lines with radar blips.
 */
export function GenerationStatus({
  airportLabel,
  lines = GATE_CONTROL_LINES,
}: {
  airportLabel: string;
  lines?: string[];
}) {
  const [line, setLine] = useState(0);
  // reset the cycle to line 0 whenever the line set changes (mode switch) —
  // render-time state adjustment (setState-in-effect is lint-banned in this repo)
  const [prevLines, setPrevLines] = useState(lines);
  if (prevLines !== lines) {
    setPrevLines(lines);
    setLine(0);
  }

  useEffect(() => {
    const id = setInterval(() => setLine((l) => (l + 1) % lines.length), 1100);
    return () => clearInterval(id);
  }, [lines]);

  return (
    <div
      className="mx-auto w-full max-w-xl rounded-xl border border-primary/25 bg-card/80 p-8 text-center backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="radar-dot size-2.5 rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.22}s` }}
          />
        ))}
        <Radio className="size-5 text-primary board-glow" aria-hidden="true" />
        {[2, 1, 0].map((i) => (
          <span
            key={i}
            className="radar-dot size-2.5 rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.22}s` }}
          />
        ))}
      </div>

      <p className="mt-5 font-mono text-sm font-bold tracking-[0.2em] text-primary board-glow blink-slow">
        {lines[line]}
      </p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        ROUTING: {airportLabel} — HOLD YOUR SEAT, ADVENTURE INBOUND
      </p>

      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-1/3 rounded-full bg-primary/70 ticker" style={{ width: "40%" }} />
      </div>
    </div>
  );
}
