# 📖 Docs — conventions, template & index

> This folder exists for one reason: **at 4 AM, mid-hackathon, when something breaks, we fix it from docs — not from memory.**

---

## Where knowledge lives

| Path | Purpose | Update when |
|---|---|---|
| `/README.md` | project overview, quickstart, API summary | top-level facts change |
| `/EXPLAINER.md` | plain-English explanation of the whole site for non-technical readers | product story changes |
| `/PLAN.md` | hackathon strategy, pitches, risks | strategy changes (rare) |
| `/HACKATHON-NIGHT.md` | tonight's build priorities & judge prep | priorities change |
| `/worklog.md` | chronological log of ALL work (append-only) | **every work session** |
| `/docs/README.md` | this file — convention + index | new feature doc added |
| `/docs/features/NN-slug.md` | deep-dive on one major feature | feature changes meaningfully |

---

## When do I create a feature doc?

Create `docs/features/NN-slug.md` (zero-padded number, kebab-case) when you:
- ✅ ship a **major feature** (new AI pipeline, new game mechanic, new subsystem)
- ✅ make a **major change** to an existing subsystem (swap LLM strategy, redesign pass)
- ✅ build something with **non-obvious internals** someone will trip on later (streaming, caching, fallback chains)

Don't create one for copy tweaks, minor bugfixes, or styling nits — those go in `worklog.md`.

---

## The template (copy this exactly)

```markdown
# NN. Feature name

> Status: ✅/🚧/🧪 · Last verified: YYYY-MM-DD · Owner: <who built it>

## TL;DR
One or two sentences. What it does, why it matters for the demo.

## Why it exists (rubric tie)
Which judging marks this serves and how. (Built 20 / Creativity 10 /
Travel 10 / Execution 5 / Demo 5 — see PLAN.md §1.)

## Files
| File | Responsibility |
|---|---|
| `path` | one line |

## How it works
The actual mechanics: data flow, key functions, state, edge cases.
Reference real type/prop/function names from the code. Short code
snippets allowed (5–15 lines max, only the load-bearing part).

## Reference
Props table / API contract table / CSS class table — whichever fits.

## Extend tonight (recipes)
Numbered, concrete: "To add X: 1) edit file A 2) add prop Y 3) ..."
This section is what tonight's build actually consumes.

## Troubleshooting (symptom → cause → fix)
| Symptom | Cause | Fix |
|---|---|---|
| what you see | why it happens | exact fix |

## Verify it works
Exact commands / browser steps that prove it (curl one-liners with
real payloads, or click-path). Someone must be able to paste-run this.
```

**Quality bar:** every claim must match the real code (read the file before writing about it). Real names, real paths, runnable curl commands. Under ~250 lines.

---

## Index of feature docs

| # | Doc | Covers |
|---|---|---|
| 01 | [`01-night-terminal-design-system.md`](./features/01-night-terminal-design-system.md) | tokens, fonts, signature CSS, animation classes, component inventory |
| 02 | [`02-input-flow-and-airport-data.md`](./features/02-input-flow-and-airport-data.md) | airport dataset, combobox, duration slider, vibe picker, departure board |
| 03 | [`03-ai-mission-pipeline.md`](./features/03-ai-mission-pipeline.md) | `/api/ai/plan`, `/api/ai/postcard`, `/api/ai/announce`, zod contract, caching |
| 04 | [`04-boarding-pass-experience.md`](./features/04-boarding-pass-experience.md) | boarding pass card, mission timeline, stamps, generation status |
| 05 | [`05-demo-mode-fallback-chain.md`](./features/05-demo-mode-fallback-chain.md) | pre-baked plans, 3-layer fallback, TRAINING MODE, fake streaming |
| 06 | [`06-database-and-wall.md`](./features/06-database-and-wall.md) | Prisma models, trips archive, stamp minting, wall of adventures |
| 07 | [`07-transport-modes.md`](./features/07-transport-modes.md) | AIR ⇄ ROAD mode engine, road stops, ROUTE CONTROL persona, mode-aware components (v2) |
| 08 | [`08-wings-wheels-highway-mode.md`](./features/08-wings-wheels-highway-mode.md) | **v3 WINGS ⇄ WHEELS**: full highway-sign skin, journey model (FROM→TO + BUS/TRAIN), the old bus ticket with punch-holes, wheels demo journeys, `[data-mode]` theming; v4+ world-swap choreography (wheel roll / full-screen jet) + red LED advisory |
| 09 | [`09-postcard-press.md`](./features/09-postcard-press.md) | async postcard press (job queue + polling), proxy-timeout root cause, SAVE POSTCARD |
| 10 | [`10-theme-toggle.md`](./features/10-theme-toggle.md) | DAY ⇄ NIGHT toggle — 4 palettes (air/road × night/day), `html.light` token engine, machines-stay-dark doctrine, hydration-safe toggle |
| 11 | [`11-access-profiles.md`](./features/11-access-profiles.md) | EVERY BODY BOARDS — IATA SSR access profiles (WCHR/DPNA/DEAF): planned-for-body missions, ticket SSR print, LED caption feed, low-stim motion mute |
| 12 | [`12-crew-leaderboard.md`](./features/12-crew-leaderboard.md) | CREW GATE login (callsign + hashed 4-digit PIN), badges = stamped missions, STOP leaderboards (people ranked per airport/rail/bus stop) + OVERALL, `YOU` highlight, live board refresh |
| 13 | [`13-uspa-self-clearing-board.md`](./features/13-uspa-self-clearing-board.md) | USP-A "THE BOARD DEFENDS YOUR TIME" — demo clock (1s=3 journey min), mission windows, solari flips SCRUBBED with flap animation, WINDOW CLOSED chips, REPLAN re-anchors fresh missions at the clock |

## Cross-cutting playbooks

| Doc | Covers |
|---|---|
| [`cost-playbook.md`](./cost-playbook.md) | **COST GUARD** — the 3-tier cost ladder (showcase/cache/live), hard hourly budget, ₹0 demo mode, footer meter, organizer Q&A script |

---

## Worklog discipline (`/worklog.md`)

Append one section per task — **never reorder or rewrite old entries**:

```markdown
---
Task ID: <id>
Agent: <name>
Task: <what was asked>

Work Log:
- <concrete step>
- <concrete step>

Stage Summary:
- <key results / decisions / artifacts>
```

Rule of thumb: write it as if the next reader is you, 6 hours more tired, holding a phone flashlight on a dying laptop.
