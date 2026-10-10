"use client";

import { Coffee, UtensilsCrossed, Compass, Sparkles, Rocket } from "lucide-react";
import { VIBES, type VibeId } from "@/lib/plan-schema";

const VIBE_ICONS: Record<VibeId, React.ComponentType<{ className?: string }>> = {
  chill: Coffee,
  foodie: UtensilsCrossed,
  explorer: Compass,
  weird: Sparkles,
  maxout: Rocket,
};

/** WHEELS re-flavors the hints — no terminal words on the highway. */
const ROAD_HINTS: Partial<Record<VibeId, string>> = {
  foodie: "eat every dhaba dry",
  explorer: "see every ghat and junction",
};

/**
 * Traveler vibe selector — single-select chips that feed the AI prompt.
 * Hints follow the mode: WINGS says "eat the terminal", WHEELS says dhaba.
 */
export function VibePicker({
  value,
  onChange,
  mode = "air",
}: {
  value: VibeId;
  onChange: (v: VibeId) => void;
  mode?: "air" | "road";
}) {
  return (
    <div className="space-y-3">
      <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
        TRAVELER VIBE
      </span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Traveler vibe">
        {VIBES.map((v) => {
          const Icon = VIBE_ICONS[v.id];
          const selected = value === v.id;
          const hint = (mode === "road" ? ROAD_HINTS[v.id] : undefined) ?? v.hint;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={selected}
              title={hint}
              onClick={() => onChange(v.id)}
              className={`flex items-center gap-2 min-h-11 px-4 rounded-md border text-sm transition-all ${
                selected
                  ? "glow-amber bg-primary text-primary-foreground border-primary font-semibold"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
