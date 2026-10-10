# 01. Night Terminal design system

> Status: ✅ · Last verified: 2026-10-10 · Owner: Z.ai Code (main) · documented by task 2-a

## TL;DR
The app's entire visual identity lives in one file: `src/app/globals.css` defines the token sheet (`:root`), maps it to Tailwind 4 utilities (`@theme inline`), and hand-rolls 16 signature CSS classes (split-flap, perforation, barcode, stamp-slam…). Amber `#f5a623` on near-black `#0b0b0d`, with paper-cream `#f4efe4` passes. Dark-theme only, deliberately no blue/indigo.

## Why it exists (rubric tie)
- **Execution (5) + Demo (5):** a distinctive, consistent look is what a judge remembers after 60 seconds at ~100 booths. Blue dashboards are the default AI-slop look; we opted out (PLAN.md §3: "NO blue/indigo — deliberately distinctive").
- **What was built (20):** tokens + signature classes are primitives tonight's build reuses — every new component (passport view, share card, delay planner) gets the terminal look for free.
- **Travel connection (10):** split-flap boards, boarding-pass paper, rubber-stamp ink — the design IS the travel artifact.

## Files
| File | Responsibility |
|---|---|
| `src/app/globals.css` | tokens, `@theme inline` mapping, base layer, scrollbar, ALL signature classes + keyframes |
| `src/app/layout.tsx` | Sora + Space Mono via `next/font`, metadata, `viewportFit: "cover"` |
| `src/components/terminal/departure-board.tsx` | consumes `.flap-cell`, `.flipping`, `.scanlines`, `.board-glow` |
| `src/components/terminal/boarding-pass-card.tsx` | consumes `.pass-enter`, `.perforation-v/h`, `.notch`, `.barcode`, `.qr-blocks`, `.blink-slow` |
| `src/components/terminal/stamp-badge.tsx` | consumes `.stamp-slam` (+ `--stamp-rot`), `.ghost-stamp` |
| `src/components/terminal/generation-status.tsx` | consumes `.radar-dot`, `.board-glow`, `.blink-slow`, `.ticker` |
| `src/app/page.tsx` | consumes `.ticker`, `.pass-enter`, `.board-glow`, `.safe-bottom` |

## How it works
**Token pipeline (Tailwind 4 style — 3 steps):**
1. `:root` in `globals.css` declares raw values (`--primary: #f5a623;`).
2. `@theme inline` maps each to a color namespace (`--color-primary: var(--primary);`).
3. Tailwind generates utilities on demand: `bg-primary`, `text-primary-foreground`, `border-border`, `ring-ring/50`… Custom namespaces `paper`, `ink`, `flap`, `signal` work the same way (`bg-paper`, `text-ink`, `text-signal`).

**Fonts:** `layout.tsx` loads `Sora` (weights 400–800, variable `--font-sora`) and `Space_Mono` (400/700, `--font-space-mono`) via `next/font/google`, and both variables are attached to `<body>`. `@theme inline` maps `--font-sans: var(--font-sora)` and `--font-mono: var(--font-space-mono)` → so `font-sans` = Sora, `font-mono` = Space Mono everywhere.

**Dark-theme only:** all tokens are defined once in `:root`; there is no `.dark` override (the `@custom-variant dark` hook exists but nothing toggles it). `<html suppressHydrationWarning>` guards against next/font attribute mismatches.

**Background treatment:** `body` = `bg-background` + two fixed radial gradients — amber `rgba(245,166,35,0.07)` at top-center, signal-green `rgba(63,166,106,0.04)` at bottom-right. `::selection` is amber at 0.35. Scrollbars are custom dark (track `#0b0b0d`, thumb `#2a2820`, hover `#3d3a2e`) — WebKit only, Firefox falls back silently.

**Signature classes are plain CSS** (outside any `@layer`), so unlike utilities they always ship — no purge risk.

## Reference

### Token table (`:root` → real values)
| Token | Value | Utility | Used for |
|---|---|---|---|
| `--background` | `#0b0b0d` | `bg-background` | page canvas, perforation "holes" |
| `--foreground` | `#f2eee3` | `text-foreground` | default text |
| `--card` / `--card-foreground` | `#141416` / `#f2eee3` | `bg-card` | planner panel, wall cards |
| `--popover` | `#17171a` | `bg-popover` | combobox dropdown |
| `--primary` / `--primary-foreground` | `#f5a623` / `#1a1206` | `bg-primary`, `text-primary` | amber — CTAs, highlights, glow |
| `--secondary` | `#1e1d20` | `bg-secondary` | slider track, subtle fills |
| `--muted` / `--muted-foreground` | `#1a191c` / `#94907f` | `text-muted-foreground` | labels, captions |
| `--accent` / `--accent-foreground` | `#26231d` / `#f5a623` | `bg-accent` | hover fills |
| `--destructive` | `#e5484d` | `text-destructive` | FINAL CALL row, errors |
| `--border` / `--input` | `rgba(242,238,227,.14)` / `.18` | `border-border` | hairlines |
| `--ring` | `rgba(245,166,35,.55)` | `ring-ring` | focus rings (amber) |
| `--paper` / `--paper-foreground` / `--paper-muted` | `#f4efe4` / `#17150f` / `#6f6a5c` | `bg-paper`, `text-ink` | boarding-pass paper |
| `--ink` | `#17150f` | `text-ink`, `bg-ink` | barcode bars, ACTIVE chip |
| `--flap` / `--flap-foreground` | `#17181c` / `#f5a623` | (used via `.flap-cell`) | split-flap cells |
| `--signal` | `#3fa66a` | `text-signal` | "on time" green |
| `--chart-1…5` | `#f5a623 #3fa66a #c2452d #e8d9b0 #8e8a7e` | `bg-chart-1`… | reserved for charts |
| `--radius` | `0.75rem` | `rounded-lg` chain (`sm` −4px … `xl` +4px) | all corners |

### Signature CSS class table
| Class | Effect | Used by |
|---|---|---|
| `.flap-cell` | split-flap cell: vertical gradient `#212329→#17181c→#0f1013`, inset bevel shadows, `perspective:300px`; `::after` = 1px hinge line at 50% | `departure-board.tsx` |
| `.flap-cell.flipping .flap-face` | `flap-flip` 0.12s ease-in: rotateX 0→90→−90→0, brightness flash at the hinge | `departure-board.tsx` |
| `.flap-face` | `will-change: transform` | `departure-board.tsx` |
| `.scanlines` | repeating 1px/3px dark lines — CRT overlay | board overlay (`departure-board.tsx`, `opacity-60`) |
| `.board-glow` | amber text-shadow halo (6px @ .45 + 18px @ .18) | header LAYOVER, status lines, board text |
| `.perforation-v` | vertical tear line — radial-gradient dots of `var(--background)`, 12×14px, `repeat-y` | pass stub edge (`hidden lg:block`) |
| `.perforation-h` | horizontal variant, 14×12px, `repeat-x` | mobile stub top (`lg:hidden`) |
| `.notch` | absolute 22px circle of `var(--background)`; place with `-top-3 -left-3` etc. | perforation ends (4×) |
| `.barcode` | repeating-linear-gradient 90° of `var(--ink)` bars (2/1/3px cycle) | pass stub (`h-10 flex-1`) |
| `.qr-blocks` | `repeating-conic-gradient` 8px checkerboard | pass stub fake QR (`size-10`) |
| `.stamp-slam` | 0.45s `cubic-bezier(0.19,1.3,0.42,1)` slam: from `scale(2.6) rotate(var(--stamp-rot)−18deg) blur(2px)` → rest. End rotation comes from the `--stamp-rot` CSS var (set inline by `StampBadge`, default −8deg) | `stamp-badge.tsx` (earned && animate) |
| `.ghost-stamp` | `opacity:.16` + `grayscale(1)` — unclaimed stamp | `stamp-badge.tsx` (earned=false) |
| `.pass-enter` | 0.7s rise-in: translateY(46px) rotate(−1.6deg) scale(.97) → identity | pass card, postcard wrap |
| `.ticker` | 26s linear infinite `translateX(0→−50%)` — content must be duplicated in a `w-max` flex | page ticker, generation progress bar |
| `.blink-slow` | 1.4s `steps(2,start)` visibility blink | ACTIVE chip, status line |
| `.radar-dot` | 1.6s opacity pulse .25→1→.25 (stagger via `animationDelay`) | generation-status dots |
| `.safe-bottom` | `padding-bottom: env(safe-area-inset-bottom, 0px)` | sticky footer inner div |

## Extend tonight (recipes)
1. **Add a token:** declare in `:root` (`--danger: #e5484d;`), map in `@theme inline` (`--color-danger: var(--danger);`) → `bg-danger`/`text-danger` exist instantly. No config file edit needed.
2. **Add a signature animation class:** append to `globals.css` *outside* `@layer`: define `@keyframes my-anim { … }` then `.my-anim { animation: my-anim 0.5s ease both; }`. Use it as a plain className. CSS-only = hydration-safe.
3. **Paper-card variant** (anything that should look like a pass): `rounded-xl bg-paper text-ink ring-1 ring-black/40 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]` + the faint print texture overlay from `boarding-pass-card.tsx` (`repeating-linear-gradient(0deg, rgba(23,21,15,0.03) …)` inline style).
4. **Use tokens in new components:** amber CTA = `bg-primary text-primary-foreground`; dark panel = `bg-card border-border`; green status = `text-signal`; anything on paper = `bg-paper text-ink`, secondary text `text-paper-muted` or `text-ink/50`–`/70` opacity steps.
5. **Keep 44px touch targets:** every tappable gets `min-h-11 min-w-11` (44px) — see the mission toggle button in `mission-timeline.tsx`; primary CTA uses `min-h-14`. Add `active:scale-90` for tactile feedback.
6. **Stamp ink colors** are NOT tokens — import `CATEGORY_META` from `@/lib/plan-schema` (`meta.ink` / `meta.ring`) instead of inventing hexes.

## Troubleshooting (symptom → cause → fix)
| Symptom | Cause | Fix |
|---|---|---|
| New token has no utility (`bg-x` unknown) | declared `--x` in `:root` but forgot the `@theme inline` mapping | add `--color-x: var(--x);` to `@theme inline` |
| `bg-safe` / `text-safe` renders nothing | `--color-safe: var(--safe)` is mapped, but `--safe` was never defined in `:root` | use `--signal`/`text-signal`, or define `--safe` first |
| A class silently missing at runtime | you built the class name dynamically (`text-${tone}`) — Tailwind 4 JIT scans source strings | write full literal class names (see `TONE_STYLES` map in `departure-board.tsx`) |
| Custom hex sneaking into new code | copy-paste from old components | banned: use tokens or `CATEGORY_META`. The few existing literals (`#8a6d3b`, `#2d7d74`, `#c2452d`, `#17150f`, `#6f6a5c`) mirror `CATEGORY_META`/paper values — don't add more |
| Animation doesn't play / double-plays on load | JS-driven animation fighting hydration | keep it CSS-only (`animation` runs on first paint, no JS needed); `suppressHydrationWarning` on `<html>` is only for font attrs |
| Perforation/notches look solid | they paint `var(--background)` — invisible over anything not the page canvas | only place them on the dark background edge of paper sections |
| Firefox shows default scrollbar | custom scrollbar is `::-webkit-*` only | cosmetic, accepted; don't add JS scrollbar hacks |
| Footer clipped by iOS home indicator | missing safe-area padding | footer already has `.safe-bottom`; keep `viewportFit: "cover"` in `layout.tsx` viewport export |
| Glow/blur makes text unreadable on projector | `.board-glow` at small sizes | keep glow text ≥ `text-sm` and bold, as existing usage does |

## Verify it works
1. `npm run dev` → open `http://localhost:3000/`.
2. Split-flap: hero "WHERE TO NEXT?" cells flip in with stagger; `DepartureBoard` rows cycle every few seconds with the 0.12s flip + hinge flash; `.scanlines` overlay visible at 60% opacity; `.ticker` line scrolls left seamlessly (content repeated 3×, `translateX(-50%)` loop).
3. Eyeball tokens in DevTools: `body` computed bg `#0b0b0d` with the two fixed radial gradients; header "LAYOVER" = `#f5a623` + glow; select text anywhere → amber selection.
4. Scrollbar is dark (`#2a2820` thumb) in Chrome/Edge/Safari.
5. Mobile (390px, DevTools): footer sits above the home indicator (`.safe-bottom`); no blue anywhere in the palette.
