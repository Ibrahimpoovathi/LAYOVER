"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/** no-op store — only used so useSyncExternalStore can tell us "has React
    hydrated yet?" without setState-in-effect (lint-clean mount probe) */
const emptySubscribe = () => () => {};

/**
 * DAY ⇄ NIGHT toggle — a small switch-panel next to the mode controls.
 * Sun shows when the terminal is dark (tap for day), Moon when it's light.
 * Icon crossfades with a rotate+scale, both icons stacked so the button
 * never changes size. Token-driven: re-tints automatically in WHEELS mode.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Before hydration we assume the brand default (night) so the SSR markup
  // and the first client render are identical — no hydration mismatch.
  const isNight = mounted ? resolvedTheme !== "light" : true;
  const label = isNight
    ? "Switch to DAY TERMINAL (light theme)"
    : "Switch to NIGHT TERMINAL (dark theme)";

  return (
    <button
      type="button"
      onClick={() => setTheme(isNight ? "light" : "dark")}
      aria-label={label}
      aria-pressed={!isNight}
      title={label}
      className={cn(
        "glow-amber flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card/60 text-foreground transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span className="relative block size-4" aria-hidden="true">
        <Sun
          className={cn(
            "absolute inset-0 size-4 transition-all duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]",
            isNight ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0",
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 size-4 transition-all duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]",
            isNight ? "-rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
        />
      </span>
      <span className="sr-only">Toggle light / dark theme</span>
    </button>
  );
}
