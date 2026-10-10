/**
 * THE ZERO-COST PRESS — postcards drawn in code.
 *
 * When the hourly AI budget is spent (or AI_SHOWCASE=1), the postcard press
 * doesn't jam — it falls back to this deterministic local illustrator.
 * Same 1344x768 canvas, same vintage travel-poster palette, zero network
 * calls, zero rupees. Output is an SVG data URL the UI renders exactly like
 * an AI-pressed postcard (marked source:"showcase" upstream).
 *
 * Scenes are mode-aware, like the AI prompts:
 *   air        → night terminal silhouette + jet climbing past the tower
 *   road/bus   → boxy inter-state bus winding up ghat hairpins
 *   road/train → passenger train crossing a backwater bridge
 */

type Mode = "air" | "road";
type Vehicle = "bus" | "train";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

interface Palette {
  skyTop: string;
  skyMid: string;
  sun: string;
  halo: string;
  hillFar: string;
  hillNear: string;
  ink: string;
  glow: string;
}

const PALETTES: Palette[] = [
  // golden dusk
  { skyTop: "#FBE7B2", skyMid: "#F5B94A", sun: "#E8862E", halo: "#F7C948", hillFar: "#8A6A35", hillNear: "#3E2F17", ink: "#241A0C", glow: "#FFE9B8" },
  // rust ghats
  { skyTop: "#FCE4C8", skyMid: "#F0A05A", sun: "#D9603B", halo: "#F2B04A", hillFar: "#7E4A33", hillNear: "#40231A", ink: "#26150F", glow: "#FFDFB0" },
  // backwater green
  { skyTop: "#F6ECC8", skyMid: "#EFC257", sun: "#E08E2B", halo: "#F6D87C", hillFar: "#5E6B33", hillNear: "#2C3A1E", ink: "#1C2412", glow: "#FFF0C2" },
];

export function svgPostcard(
  city: string,
  country: string,
  mode: Mode,
  vehicle: Vehicle,
  vibe: string,
): string {
  const seed = hash(`${city.toLowerCase()}|${mode}|${vehicle}|${vibe}`);
  const p = PALETTES[seed % PALETTES.length];
  const sunX = 300 + (seed % 720);
  const sunY = 200 + ((seed >> 3) % 120);
  const birds = 2 + (seed % 3);

  const sky = `
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.skyTop}"/>
        <stop offset="0.62" stop-color="${p.skyMid}"/>
        <stop offset="1" stop-color="${p.sun}"/>
      </linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.hillFar}"/>
        <stop offset="1" stop-color="${p.hillNear}"/>
      </linearGradient>
    </defs>
    <rect width="1344" height="768" fill="url(#sky)"/>
    <circle cx="${sunX}" cy="${sunY}" r="150" fill="${p.halo}" opacity="0.35"/>
    <circle cx="${sunX}" cy="${sunY}" r="92" fill="${p.sun}"/>
    <ellipse cx="${(sunX + 500) % 1344}" cy="${sunY - 130}" rx="150" ry="26" fill="${p.glow}" opacity="0.7"/>
    <ellipse cx="${(sunX + 900) % 1344}" cy="${sunY - 40}" rx="110" ry="20" fill="${p.glow}" opacity="0.55"/>`;

  const birdFlock = Array.from({ length: birds }, (_, i) => {
    const bx = 180 + i * 130 + (seed % 60);
    const by = 150 + ((seed >> i) % 90);
    return `<path d="M ${bx} ${by} q 14 -16 28 0 q 14 -16 28 0" fill="none" stroke="${p.ink}" stroke-width="5" stroke-linecap="round" opacity="0.8"/>`;
  }).join("");

  const hills = `
    <path d="M0 560 Q 170 470 340 545 T 700 540 T 1060 550 T 1344 520 V 768 H 0 Z" fill="${p.hillFar}" opacity="0.85"/>
    <path d="M0 640 Q 220 560 460 630 T 940 625 T 1344 600 V 768 H 0 Z" fill="${p.hillNear}"/>`;

  const frame = `
    <rect x="26" y="26" width="1292" height="716" rx="16" fill="none" stroke="${p.glow}" stroke-width="6" opacity="0.5"/>`;

  let scene = "";

  if (mode === "air") {
    scene = `
      <rect x="0" y="672" width="1344" height="96" fill="${p.ink}"/>
      <g fill="${p.glow}" opacity="0.9">
        ${Array.from({ length: 12 }, (_, i) => `<rect x="${80 + i * 106}" y="700" width="46" height="7" rx="3"/>`).join("")}
      </g>
      <g fill="${p.ink}">
        <rect x="1020" y="470" width="34" height="210" rx="6"/>
        <path d="M986 470 h102 l-14 -64 h-74 Z"/>
        <rect x="1028" y="386" width="12" height="30" rx="4"/>
        <circle cx="1034" cy="380" r="9"/>
        <path d="M60 672 v-150 q0 -22 22 -22 h340 q22 0 22 22 v150 Z" opacity="0.9"/>
      </g>
      <g fill="${p.glow}" opacity="0.85">
        ${Array.from({ length: 7 }, (_, i) => `<rect x="${92 + i * 54}" y="560" width="30" height="34" rx="4"/>`).join("")}
      </g>
      <g transform="translate(430 330) rotate(-14)" fill="${p.ink}">
        <path d="M0 26 L150 6 q66 -8 118 6 l58 20 q10 4 0 8 l-64 16 q-56 12 -112 4 L0 46 q-12 -2 0 -20 Z"/>
        <path d="M96 8 l-58 -52 q-6 -8 6 -8 l22 2 54 50 Z"/>
        <path d="M110 52 l-46 44 q-6 8 6 6 l20 -4 44 -40 Z"/>
        <path d="M28 14 l-44 -18 q-8 -4 -4 8 l10 22 40 4 Z"/>
      </g>
      <path d="M420 420 L 80 560" stroke="${p.glow}" stroke-width="7" stroke-linecap="round" opacity="0.5" stroke-dasharray="2 26"/>`;
  } else if (vehicle === "train") {
    scene = `
      <rect x="0" y="600" width="1344" height="168" fill="url(#water)"/>
      <g stroke="${p.glow}" stroke-width="6" stroke-linecap="round" opacity="0.4">
        <path d="M120 660 h150"/><path d="M420 700 h190"/><path d="M820 668 h160"/><path d="M1040 716 h180"/>
      </g>
      <g fill="${p.ink}">
        <rect x="0" y="470" width="1344" height="46" rx="6"/>
        <path d="M180 516 a70 70 0 0 1 140 0 Z" fill="url(#water)"/>
        <path d="M560 516 a70 70 0 0 1 140 0 Z" fill="url(#water)"/>
        <path d="M940 516 a70 70 0 0 1 140 0 Z" fill="url(#water)"/>
        <rect x="150" y="404" width="1050" height="70" rx="14"/>
        <rect x="1180" y="360" width="34" height="120" rx="8"/>
      </g>
      <g fill="${p.glow}">
        ${Array.from({ length: 12 }, (_, i) => `<rect x="${190 + i * 82}" y="420" width="44" height="26" rx="6" opacity="0.92"/>`).join("")}
      </g>
      <g fill="${p.ink}" opacity="0.75">
        <ellipse cx="150" cy="330" rx="60" ry="22"/><ellipse cx="210" cy="300" rx="80" ry="28"/>
      </g>
      <g fill="${p.ink}">
        <path d="M60 600 q10 -90 16 -150 q2 -18 16 -18 t16 18 q6 60 16 150 Z"/>
        <path d="M108 -20 q-70 10 -66 78 q30 -34 66 -30 q-52 26 -30 84 q14 -44 60 -48 q-34 34 -6 76 q10 -50 56 -58 q44 -8 58 -50 l-2 -40 q-64 -36 -152 -12 Z" transform="translate(1120 520) scale(0.9)"/>
      </g>`;
  } else {
    scene = `
      <path d="M -40 768 C 240 640 180 520 420 470 C 640 425 620 330 860 300 C 1060 275 1120 240 1384 210"
            fill="none" stroke="${p.ink}" stroke-width="96" stroke-linecap="round"/>
      <path d="M -40 768 C 240 640 180 520 420 470 C 640 425 620 330 860 300 C 1060 275 1120 240 1384 210"
            fill="none" stroke="${p.glow}" stroke-width="7" stroke-dasharray="34 40" opacity="0.75"/>
      <g transform="translate(430 430) rotate(-24)">
        <rect x="-130" y="-58" width="260" height="116" rx="18" fill="${p.ink}"/>
        <rect x="-130" y="-58" width="260" height="30" rx="14" fill="${p.hillFar}"/>
        <g fill="${p.glow}">
          <rect x="-108" y="-20" width="38" height="30" rx="6"/><rect x="-58" y="-20" width="38" height="30" rx="6"/>
          <rect x="-8" y="-20" width="38" height="30" rx="6"/><rect x="42" y="-20" width="38" height="30" rx="6"/>
        </g>
        <circle cx="-78" cy="62" r="24" fill="${p.ink}"/><circle cx="-78" cy="62" r="10" fill="${p.glow}" opacity="0.6"/>
        <circle cx="78" cy="62" r="24" fill="${p.ink}"/><circle cx="78" cy="62" r="10" fill="${p.glow}" opacity="0.6"/>
        <rect x="118" y="-30" width="26" height="18" rx="6" fill="${p.sun}"/>
      </g>
      <g fill="${p.ink}">
        <path d="M120 620 q12 -110 20 -180 q2 -20 18 -20 t18 20 q8 70 20 180 Z" transform="translate(950 -60)"/>
        <path d="M60 620 q10 -90 16 -150 q2 -18 16 -18 t16 18 q6 60 16 150 Z" transform="translate(1080 -20)"/>
      </g>
      <g fill="${p.ink}">
        <path d="M900 560 v-90 h150 v90 Z" opacity="0.95"/>
        <path d="M880 470 l95 -60 95 60 Z"/>
        <rect x="930" y="500" width="34" height="60" fill="${p.glow}" opacity="0.85"/>
      </g>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1344 768" width="1344" height="768">
    ${sky}
    ${birdFlock}
    ${hills}
    ${scene}
    ${frame}
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
