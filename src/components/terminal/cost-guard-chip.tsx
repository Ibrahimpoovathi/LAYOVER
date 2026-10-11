"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

/**
 * COST GUARD chip — the footer readout that answers the organizers'
 * cost question live, in the UI:
 *
 *   COST GUARD · LIVE 3/60 · SAVED 9
 *
 * LIVE = real AI calls spent this hour vs the hard hourly budget.
 * SAVED = requests answered from cache or by the zero-cost showcase
 * press instead of a paid call.
 *
 * Dot color mirrors tierState: green under budget, amber at ≥80%,
 * red when the ceiling is hit (everything degrades to showcase then).
 */

interface CostSnapshot {
  budget: number;
  liveThisHour: number;
  remaining: number;
  savedCalls: number;
  tierState: "ok" | "warn" | "capped";
  showcaseLock: boolean;
}

const DOT: Record<CostSnapshot["tierState"], string> = {
  ok: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
  warn: "bg-primary shadow-[0_0_8px_rgba(245,166,35,0.8)]",
  capped: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
};

export function CostGuardChip() {
  const [cost, setCost] = useState<CostSnapshot | null>(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch("/api/cost", { cache: "no-store" });
        const data = await res.json();
        if (alive && data?.ok) setCost(data.cost as CostSnapshot);
      } catch {
        // chip is cosmetic — never let it complain
      }
    }
    void tick();
    const id = setInterval(tick, 12_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!cost) return null;

  return (
    <span
      className="hidden items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground sm:flex"
      title={`COST GUARD — live AI calls this hour: ${cost.liveThisHour}/${cost.budget}${cost.showcaseLock ? " · SHOWCASE LOCK ON (zero-spend mode)" : ""}. SAVED = requests served free from cache or the local showcase press. At the ceiling every feature degrades to zero-cost fixtures instead of failing.`}
    >
      <ShieldCheck className="size-3.5" aria-hidden="true" />
      <span className="sr-only">Cost guard — </span>
      <span aria-hidden="true" className={`inline-block size-1.5 rounded-full ${DOT[cost.tierState]}`} />
      <span aria-hidden="true">
        LIVE {cost.liveThisHour}/{cost.budget} · SAVED {cost.savedCalls}
        {cost.showcaseLock ? " · SHOWCASE" : ""}
      </span>
    </span>
  );
}
