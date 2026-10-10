"use client";

import { Bus, TrainFront, Plane } from "lucide-react";
import { MODE_LIST } from "@/lib/modes";
import { cn } from "@/lib/utils";

/**
 * WINGS ⇄ WHEELS segmented control — the one switch that re-skins the whole terminal.
 * The active pill is a single sliding thumb (transform-animated, 300ms) so the
 * world swap starts under your finger. Presentational only: the page owns mode
 * state and reacts to onChange. Registry-driven (MODE_LIST), so adding
 * RAIL/WATER to modes.ts extends this for free.
 */
export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: "air" | "road";
  onChange: (m: "air" | "road") => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Transport mode"
      className="relative inline-grid grid-cols-2 rounded-lg border border-border bg-card/60 p-1"
    >
      {/* sliding thumb — bg-primary re-tints per world via tokens */}
      <span
        aria-hidden="true"
        className={cn(
          "glow-amber absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-primary transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]",
          mode === "road" ? "translate-x-full" : "translate-x-0",
        )}
      />
      {MODE_LIST.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={
              m.id === "air" ? "Wings mode — flight layovers" : "Wheels mode — bus and train journeys"
            }
            onClick={() => onChange(m.id)}
            className={cn(
              "relative z-10 flex min-h-11 w-full items-center justify-center gap-2 px-4 font-mono text-xs font-bold tracking-[0.25em] transition-colors duration-300",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.icon === "plane" ? (
              <Plane className="size-4" />
            ) : (
              <span className="flex items-center gap-1" aria-hidden="true">
                <Bus className="size-4" />
                <TrainFront className="size-4" />
              </span>
            )}
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
