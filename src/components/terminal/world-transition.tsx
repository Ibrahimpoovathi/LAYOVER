"use client";

import { Bus, Plane } from "lucide-react";

/**
 * Side-view airliner silhouette, nose pointing WEST (left) on a slight
 * climb. Drawn to be unmistakable at ANY zoom — because this jet flies
 * through at ~1.5× the screen width, the airframe itself fills the
 * viewport as it crosses. Body amber, windows/doors/intakes dark cuts.
 */
function JetSilhouette({ className }: { className?: string }) {
  const windows = Array.from({ length: 14 }, (_, i) => (
    <rect key={i} x={170 + i * 34} y={136} width={13} height={9} rx={3} fill="#8a6a14" opacity={0.75} />
  ));
  return (
    <svg
      className={className}
      viewBox="0 0 1000 320"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* tailfin */}
      <path d="M 745 130 L 930 20 Q 952 8 958 30 L 972 128 Z" fill="#f7c948" />
      {/* tailplane */}
      <path d="M 850 156 L 998 118 L 998 144 L 876 174 Z" fill="#e8b53a" />
      {/* fuselage — nose at left, tailcone tapering up at right */}
      <path
        d="M 6 162 Q 30 128 120 116 Q 180 110 260 110 L 640 108 Q 730 108 800 120 Q 880 134 950 142 Q 984 146 990 158 Q 992 168 962 172 Q 860 186 720 192 L 260 198 Q 120 196 60 184 Q 20 176 6 162 Z"
        fill="#f7c948"
      />
      {/* cockpit glass */}
      <path d="M 52 140 L 116 127 L 116 143 L 60 149 Z" fill="#8a6a14" />
      {/* window line */}
      {windows}
      {/* doors */}
      <rect x={142} y={128} width={16} height={34} rx={5} fill="#8a6a14" opacity={0.65} />
      <rect x={648} y={126} width={16} height={34} rx={5} fill="#8a6a14" opacity={0.65} />
      {/* swept main wing (near side) */}
      <path d="M 470 164 L 762 260 L 786 244 L 520 150 Z" fill="#e8b53a" />
      {/* engine pods + intakes */}
      <rect x={582} y={192} width={106} height={40} rx={20} fill="#f7c948" />
      <ellipse cx={586} cy={212} rx={13} ry={20} fill="#241a0c" />
      <rect x={700} y={216} width={96} height={36} rx={18} fill="#f7c948" />
      <ellipse cx={704} cy={234} rx={12} ry={18} fill="#241a0c" />
    </svg>
  );
}

/**
 * World-swap overlay — the cinematic mode transition.
 *
 * to-road: a wheel rolls across the screen left-to-right, unrolling the
 *          WHEELS world (asphalt, hazard edges, lane dashes) behind it
 *          like fresh tarmac.
 * to-air:  a full-screen jet blasts through right-to-left on a gentle
 *          climb — the airframe is ~1.5× the viewport wide, so the plane
 *          itself fills the screen as it passes — twin contrails trailing
 *          east behind it, the amber night sky unrolling in from the
 *          right edge.
 *
 * Presentational only: page.tsx owns the timers and flips data-mode the
 * moment the vehicle crosses mid-screen, while .mode-morphing crossfades
 * every color underneath.
 */
export function WorldTransition({ kind }: { kind: "to-road" | "to-air" }) {
  return (
    <div
      aria-hidden="true"
      className="world-transition pointer-events-none fixed inset-0 z-[90] overflow-hidden"
    >
      {kind === "to-road" ? (
        <>
          <div className="world-wipe world-wipe-road">
            <span className="road-centerline" />
          </div>
          <div className="world-wheel">
            <span className="wheel-shadow" />
            <span className="wheel-spin">
              <span className="wheel-tire" />
              <span className="wheel-rim" />
              <span className="wheel-hub" />
            </span>
          </div>
          <div className="world-tag world-tag-road font-mono">
            <Bus className="size-4" aria-hidden="true" />
            ENTERING WHEELS DIVISION
          </div>
        </>
      ) : (
        <>
          <div className="world-wipe world-wipe-air" />
          <div className="world-plane">
            <span className="plane-glow" />
            <span className="plane-contrail" />
            <JetSilhouette className="plane-glyph" />
          </div>
          <div className="world-tag world-tag-air font-mono">
            <Plane className="size-4 -scale-x-100" aria-hidden="true" />
            CLEARED BACK TO WINGS
          </div>
        </>
      )}
    </div>
  );
}
