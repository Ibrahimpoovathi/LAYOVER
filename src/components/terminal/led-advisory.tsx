"use client";

import { useEffect, useState } from "react";

/**
 * HIGHWAY ADVISORY — a red LED variable-message sign (VMS), the kind
 * that hangs over national highways. This is the WHEELS world's hero
 * board: black cabinet, dot-matrix pixel grid, glowing red advisories
 * that relight like real LEDs, marching chevrons and a LIVE lamp.
 * No flaps, no solari, no airport DNA — pure electronics, pure highway.
 */

const LED_MESSAGES: string[][] = [
  ["CAUTION", "ADVENTURE AHEAD"],
  ["ROUTE CONTROL AI", "ONLINE"],
  ["NIGHT ROAD OPEN", "6 PM – 6 AM"],
  ["NEXT EXIT", "DUBAI · 9999 KM"],
  ["PAROTTA RADAR", "ACTIVE · MILE 42"],
  ["HORN OK PLEASE", "DRIVE SAFE"],
];

const CYCLE_MS = 4400;

export function LedAdvisory({ className = "" }: { className?: string }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % LED_MESSAGES.length), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const lines = LED_MESSAGES[tick];

  return (
    <div
      className={`led-frame relative ${className}`}
      role="img"
      aria-label={`Highway advisory: ${lines.join(". ")}`}
    >
      {/* cabinet bolts — one per corner, like a real sign box */}
      <span aria-hidden="true" className="led-bolt left-2 top-2" />
      <span aria-hidden="true" className="led-bolt right-2 top-2" />
      <span aria-hidden="true" className="led-bolt bottom-2 left-2" />
      <span aria-hidden="true" className="led-bolt right-2 bottom-2" />

      <div className="led-surface led-flicker">
        {/* ID strip + live lamp */}
        <div className="relative z-10 flex items-center justify-between px-3 pt-2.5 sm:px-5 sm:pt-3">
          <span className="led-text led-dim font-mono text-[9px] font-bold tracking-[0.32em] sm:text-[10px]">
            LAYOVER HIGHWAY ADVISORY
          </span>
          <span className="led-text led-dim flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.28em] sm:text-[10px]">
            <span className="led-dot led-blink" aria-hidden="true" />
            LIVE
          </span>
        </div>

        {/* message rows — remount per message so the LEDs relight */}
        <div
          key={tick}
          className="relative z-10 flex min-h-[120px] flex-col items-center justify-center gap-1.5 px-4 py-5 sm:min-h-[168px] sm:gap-2.5 sm:py-7"
        >
          {lines.map((line, i) => (
            <span
              key={line}
              className="led-text led-relight whitespace-nowrap font-mono text-[clamp(1.05rem,4vw,2.05rem)] font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em]"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              {line}
            </span>
          ))}
        </div>

        {/* bottom strip: exit id + marching chevrons */}
        <div className="relative z-10 flex items-center justify-between px-3 pb-2.5 sm:px-5 sm:pb-3">
          <span className="led-text led-dim font-mono text-[9px] tracking-[0.3em]" aria-hidden="true">
            EXIT ∞
          </span>
          <span className="flex items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="led-text led-march font-mono text-sm font-bold sm:text-base"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                ❯
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
