"use client";

import { Accessibility, Brain, EarOff, User } from "lucide-react";
import { ACCESS_PROFILES, type AccessProfileId } from "@/lib/plan-schema";

const PROFILE_ICONS: Record<AccessProfileId, React.ComponentType<{ className?: string }>> = {
  none: User,
  wchr: Accessibility,
  dpna: Brain,
  deaf: EarOff,
};

/**
 * EVERY BODY BOARDS — assistance profile selector.
 * Real IATA SSR codes a traveler can file with an airline, offered here
 * as first-class planning inputs (not an afterthought "accessibility mode"):
 *   WCHR · step-free missions    DPNA · quiet, predictable missions
 *   DEAF · visual-twin announcements
 * The chosen code prints on the boarding pass / ticket like any airline
 * prints it, and the AI designs every mission around it.
 */
export function AccessPicker({
  value,
  onChange,
}: {
  value: AccessProfileId;
  onChange: (v: AccessProfileId) => void;
}) {
  return (
    <div className="space-y-3">
      <span className="block font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
        ASSISTANCE CODE · SSR{" "}
        <span className="text-muted-foreground/60">(optional — plans every mission around your body)</span>
      </span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Assistance profile">
        {ACCESS_PROFILES.map((p) => {
          const Icon = PROFILE_ICONS[p.id];
          const selected = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              title={p.hint}
              onClick={() => onChange(p.id)}
              className={`flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm transition-all ${
                selected
                  ? "glow-amber border-primary bg-primary font-semibold text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {p.ssr ? (
                <span className="font-mono">
                  {p.ssr} <span className="font-sans text-xs font-normal opacity-80">· {p.label}</span>
                </span>
              ) : (
                "Standard"
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
