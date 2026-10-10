# 10. Day ⇄ Night theme toggle

> Status: ✅ · Last verified: 2026-02-14 · Owner: main agent (Task 11)

## TL;DR
A Sun/Moon button in the header flips the whole terminal between the branded
**Night Terminal** (default, dark) and a **Day Terminal** (light) — in BOTH
worlds. That's four full palettes (air-night, air-day, road-night, road-day)
resolved from CSS custom properties, zero `dark:` utilities in components.

## Why it exists (rubric tie)
- **Execution 5 / Built 20**: judges will poke the header; a theme toggle that
  survives both worlds shows the design system is real tokens, not hardcoded
  hexes.
- **Demo 5**: daylight mode is the projector-safety valve — if the demo-hall
  screen washes out the amber-on-black, flip to DAY in one tap.

## Files
| File | Responsibility |
|---|---|
| `src/components/theme-provider.tsx` | `next-themes` wrapper — `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}` |
| `src/components/terminal/theme-toggle.tsx` | Sun/Moon icon button, `useSyncExternalStore` hydration probe |
| `src/app/layout.tsx` | wraps children + Toaster in `ThemeProvider` |
| `src/app/globals.css` | `:root` = night (unchanged brand), new `html.light` + `html.light [data-mode="road"]` token blocks + daylight glow/scrollbar/gradient overrides |
| `src/app/page.tsx` | `<ThemeToggle />` in the header controls |

## How it works
1. `next-themes` (already in package.json) writes `.light`/`.dark` onto `<html>`
   (`attribute="class"`), persisted in localStorage.
2. The existing `:root` token block **is** the night palette, so dark needs no
   extra CSS. Day palettes are additive:
   - `html.light { … }` → WINGS day (sunlit ivory `#f5f0e4`, deep amber
     `#a86a08`, dark ink)
   - `html.light [data-mode="road"] { … }` → WHEELS day (bright concrete
     `#edebdd`, dark hazard gold `#96740a`, sign-green accents)
3. Specificity ladder (later + stronger always wins):

   ```
   :root (0,1,0) < html.light (0,1,1) < [data-mode="road"] (0,1,0 on div,
   inherits over html for its subtree) < html.light [data-mode="road"] (0,2,0)
   ```

   The road-mode tokens live on the page-root **div** (`data-mode`, page.tsx
   L419-420), theme classes live on **html** — that's why the road-day block
   must be the double selector.
4. **Machines stay honest in both themes**: the split-flap solari (`.flap-cell`
   gradient), the red LED cabinet (`.led-frame/.led-surface/.led-text`), the
   green `sign-panel` faces, and the paper tickets (`--paper`) keep their
   physical colors — only the light AROUND them changes. Real departure boards
   are dark indoors; real VMS signs are black in daylight.
5. **Glows don't survive daylight**: neon halos read as dirt on ivory, so
   `html.light .board-glow/.glow-amber/.glow-strong` swap to print-style
   relief shadows (white top edge + faint warm drop). Road-day gets a green-
   tinted variant via `html.light [data-mode="road"] .glow-*`.
6. `color-scheme: dark` on `:root`, `light` on `html.light` → native
   scrollbars/inputs match too; `::-webkit-scrollbar-*` has an explicit light
   block.

### On-sign token scope (Task 12 — the invisible-controls fix)
A colored surface that hosts token-driven controls MUST define its own token
scope — when day/night flips, the ambient page palette re-points the shared
tokens underneath it (dark-on-green in daylight = invisible presets, chips,
slider labels). The green sign therefore runs its own contrast system in BOTH
themes:

```css
.sign-panel, .sign-panel-sm {
  color: var(--foreground);      /* re-root COMPUTED-color inheritance (body
                                    resolves --foreground outside the sign) */
  --background: #0b5a2f;         /* recessed inputs (bg-background/60) */
  --muted-foreground: #f4efe4b8; /* cream labels/chips on green */
  --popover: #0e5c30;            /* dropdown = part of the sign */
  --primary: #f5c518;            /* lamps stay hazard yellow, day or night */
  /* + --foreground/--card/--accent/--border/--input/--ring */
}
```

Custom properties resolve from the NEAREST defining ancestor, so this block
wins over both `:root` and `html.light` for everything inside the sign — no
component edits. Two gotchas it encodes:
- `--var` custom properties re-resolve per element, but **`color` inherits as
  a computed value** — any bare/inheritance-fed text (and shadcn outline/ghost
  buttons) kept body's ink until the panel re-declared `color`.
- shadcn `outline` variant sets NO text color — it inherits.

### Hydration-safe toggle
`resolvedTheme` is `undefined` pre-hydration. The toggle probes hydration with
`useSyncExternalStore(emptySubscribe, () => true, () => false)` — NOT
`useEffect(() => setMounted(true))` — which keeps `react-hooks/set-state-in-effect`
lint clean and renders identical SSR/first-paint markup (assumes night, the
brand default). After mount the icon is authoritative.

## Reference
| Piece | Value |
|---|---|
| Default / persisted | `defaultTheme="dark"`, `enableSystem={false}` (deterministic on demo day) |
| Toggle a11y | `aria-pressed`, `aria-label="Switch to DAY/NIGHT TERMINAL…"`, `title`, sr-only span |
| Night tokens | untouched `:root` block (air) + `[data-mode="road"]` block |
| Day tokens | `html.light` + `html.light [data-mode="road"]` blocks (end of globals.css) |
| Mode swap interplay | `data-mode` flips mid-world-transition; theme is orthogonal & unaffected |

## Extend tonight (recipes)
- **Tune a day color**: edit the `html.light` (air) or `html.light
  [data-mode="road"]` (wheels) block in `globals.css`. No component changes.
- **Add a third theme** (e.g. "DUSK"): add a `dusk` attr via next-themes
  `attribute="class"`, add `html.dusk { … }` tokens, extend the toggle to a
  tri-state.
- **Follow OS preference after all**: set `enableSystem` back to `true` in
  `theme-provider.tsx` (first paint stays dark via `defaultTheme`).

## Troubleshooting (symptom → cause → fix)
| Symptom | Cause | Fix |
|---|---|---|
| Toggle does nothing in WHEELS | road-day override missing | check `html.light [data-mode="road"]` block exists after the night road block |
| Wrong palette flashes on load | provider not mounted / system theme bleeding | `<ThemeProvider>` must wrap children in `layout.tsx`; `enableSystem={false}` |
| Hydration mismatch warning on header | toggle changed to setState-in-effect | keep the `useSyncExternalStore` mount probe |
| Amber glows look dusty in day | someone re-added a neon glow under `.light` | daylight glows must use the `html.light .glow-*` relief-shadow rules |
| Controls inside the green sign invisible in DAY | controls use ambient tokens; day re-points them dark-on-green | keep the on-sign `.sign-panel/.sign-panel-sm` token scope; any NEW colored surface that hosts controls needs its own scope |
| Buttons on a colored panel keep page ink | `color` inherits as computed value from body | re-declare `color: var(--foreground)` on the panel |
| REMARKS header/column + STATUS lamps unreadable on the solari in DAY (air) | board text uses ambient tokens (`text-foreground`, `text-muted-foreground`, `text-primary`) but the solari stays near-black `#0e0f12` in both themes — day re-points those tokens to dark ink → invisible on the machine | keep the on-board `.board-shell` token scope (pins `--foreground #f2eee3`, `--muted-foreground #94907f`, `--primary #f5a623`; road variant `#f5c518`) + the `html.light .board-shell .board-glow` lamp-glow exception so daylight relief-shadows don't dull the STATUS lamps |
| CSS edits "don't apply" in browser | stale Turbopack CSS chunk (hits repeatedly!) | `curl` the served CSS and grep for your rule; if missing → make a real content change (even a comment) and reload — that usually flips the chunk; only if it persists → `pkill next dev`, `rm -rf .next`, `(setsid nohup bun run dev &)` |

## Verify it works
```bash
# 1. default is night
agent-browser open http://localhost:3000
agent-browser eval "document.documentElement.className"          # → "dark"

# 2. flip to day (ref from: agent-browser snapshot -i)
agent-browser find role button click --name "Switch to DAY TERMINAL (light theme)"
agent-browser eval "getComputedStyle(document.body).backgroundColor"  # → rgb(245, 240, 228)

# 3. both worlds in day
agent-browser find role radio click --name "Wheels mode — bus and train journeys"
agent-browser eval "getComputedStyle(document.querySelector('[data-mode]')).getPropertyValue('--primary')"  # → #96740a

# 4. persistence
agent-browser reload && agent-browser eval "document.documentElement.className"  # → "light"

# 5. night restore (road keeps hazard yellow)
agent-browser find role button click --name "Switch to NIGHT TERMINAL (dark theme)"
agent-browser eval "getComputedStyle(document.querySelector('[data-mode]')).getPropertyValue('--primary')"  # → #f5c518 in road
```
Screenshots: `shots/70` (air-night) `71` (air-day) `72-73` (road-day + planner)
`74-75` (night restore, road-night regression) `76` (mobile 390 road-day)
`77` (air-day golden path with boarding pass); Task 12 fix — `80` (road-day
form fixed) `83-84` (ticket in day) `87` (cream action buttons) `89` (punch)
`90` (road-night regression); Task 13 solari fix —
`79-air-light-board-fixed` (REMARKS readable in day) `81-road-light-led`
(road-day LED cabinet) `82-air-night-board-regression` +
`83-road-night-led-regression` (night regressions, zero drift).
