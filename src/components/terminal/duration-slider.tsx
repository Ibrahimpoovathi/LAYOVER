"use client";

import { fmtDuration } from "@/lib/plan-schema";

/**
 * Layover/journey slider — 1h to 12h, 15-min steps, with quick presets.
 * Label follows the mode (LAYOVER WINDOW / TIME ON THE ROAD).
 */
const PRESETS = [60, 120, 180, 300, 480];

export function DurationSlider({
  value,
  onChange,
  label = "LAYOVER WINDOW",
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">{label}</span>
        <span className="font-mono text-2xl font-bold text-primary board-glow" aria-live="polite">
          {fmtDuration(value)}
        </span>
      </div>

      <input
        type="range"
        min={60}
        max={720}
        step={15}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-11 cursor-pointer accent-primary"
        aria-label={`Duration: ${fmtDuration(value)}`}
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick duration presets">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-pressed={value === p}
            className={`min-h-11 px-3.5 rounded-md font-mono text-xs tracking-wider border transition-all ${
              value === p
                ? "bg-primary text-primary-foreground border-primary font-bold"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {fmtDuration(p)}
          </button>
        ))}
      </div>
    </div>
  );
}
