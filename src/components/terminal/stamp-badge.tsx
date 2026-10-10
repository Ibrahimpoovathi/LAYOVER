"use client";

import { useId } from "react";
import { CATEGORY_META, type MissionCategory } from "@/lib/plan-schema";

/**
 * Passport stamp — SVG rubber stamp with a satisfying slam animation.
 * Ghost state (dashed, faint) shows what's still unclaimed.
 */

const ROTATIONS = [-9, -4, 6, 11, -13, 3];

export function StampBadge({
  category,
  earned,
  index = 0,
  size = 76,
  animate = true,
}: {
  category: MissionCategory;
  earned: boolean;
  index?: number;
  size?: number;
  animate?: boolean;
}) {
  const uid = useId().replace(/[:]/g, "");
  const meta = CATEGORY_META[category];
  const rot = ROTATIONS[index % ROTATIONS.length];

  return (
    <div
      className={earned && animate ? "stamp-slam" : ""}
      style={
        {
          "--stamp-rot": `${rot}deg`,
          transform: earned && !animate ? `rotate(${rot}deg)` : undefined,
          width: size,
          height: size,
        } as React.CSSProperties
      }
      aria-label={`${meta.label} stamp ${earned ? "earned" : "locked"}`}
      role="img"
    >
      <svg
        viewBox="0 0 100 100"
        className={earned ? "opacity-95" : "ghost-stamp"}
        style={{ transform: `rotate(${rot}deg)` }}
      >
        <defs>
          <path id={`stamp-arc-${uid}`} d="M50,50 m-33,0 a33,33 0 1,1 66,0 a33,33 0 1,1 -66,0" />
        </defs>
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={meta.ring}
          strokeWidth="3.5"
          strokeDasharray={earned ? "0" : "5 6"}
          opacity={earned ? 1 : 0.5}
        />
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke={meta.ring}
          strokeWidth="1.5"
          opacity={earned ? 0.9 : 0.4}
        />
        <text
          fontSize="9.5"
          fontWeight="700"
          letterSpacing="2.6"
          fill={meta.ink}
          fontFamily="var(--font-space-mono), monospace"
          opacity={earned ? 1 : 0.4}
        >
          <textPath href={`#stamp-arc-${uid}`} startOffset="2%">
            {"LAYOVER · 2026 · CALICUT · "}
          </textPath>
        </text>
        <text
          x="50"
          y="47"
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          letterSpacing="1.5"
          fill={meta.ink}
          fontFamily="var(--font-space-mono), monospace"
          opacity={earned ? 1 : 0.4}
        >
          {meta.label}
        </text>
        <text
          x="50"
          y="63"
          textAnchor="middle"
          fontSize="8"
          letterSpacing="2"
          fill={meta.ink}
          fontFamily="var(--font-space-mono), monospace"
          opacity={earned ? 0.85 : 0.4}
        >
          {earned ? "CLEARED" : "PENDING"}
        </text>
        {/* ink texture smudge */}
        {earned && (
          <circle cx="68" cy="34" r="9" fill={meta.ink} opacity="0.12" />
        )}
      </svg>
    </div>
  );
}
