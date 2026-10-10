# LAYOVER 2026 — WINNING BATTLE PLAN

> Event: LAYOVER 2026 — overnight travel hackathon at TinkerSpace Calicut, Kozhikode
> Date: 10–11 October 2026 · Check-in 5:00 PM · Build 6:00 PM – 6:00 AM · Judging 7:00 – 9:30 AM
> Team: Solo or duo (max 2) · Free entry · AI tools explicitly allowed

---

## 1. THE EVENT, DECODED

### Hard facts
- **Theme**: TRAVEL. One broad theme, zero fixed problem statements. "Useful, weird, or gloriously pointless" all welcome.
- **Scale**: Up to 200 students → roughly 100–150 projects on the floor.
- **One rule**: Build it and demo it before 9:30 AM.
- **Teams**: Solo or duo. Overnight build, mentors circulate.
- **Hardware + Software + AI**: All allowed. Bring your own laptop/components.
- **Working on existing projects**: "Expectation is that you build and make meaningful progress during the hackathon." → Our base must stay a TOOLKIT, not a finished product. The product gets built tonight, in the room.

### Judging math (50 marks, two rounds)
| Criterion | Marks | What it really means |
|---|---|---|
| What was built | **20** | Substance: working features, real full-stack, depth of build |
| Creativity & idea | **10** | Distinctiveness among ~100 projects; the "why didn't I think of that" factor |
| Travel connection | **10** | Travel must be the SOUL of the idea, not a sticker on it |
| Execution | **5** | It works, it doesn't crash, code quality is visible |
| Demo & experience | **5** | Showmanship: live, interactive, memorable moment |

**Round 1 (7:00–8:00 AM)**: Science-fair booth walkthrough. Judges see EVERY project, ~60–90 seconds each. → We need instant visual magnetism + a 30-second pitch + a demo the judge can touch.
**Shortlist**: ~20 finalists announced 8:00–8:15 AM.
**Round 2 (8:15–9:00 AM)**: ~2-minute pitch + demo to full judge panel. → Tight, choreographed, zero-friction demo.
**Final call (9:00–9:30 AM)**: One overall winner → Dubai trip (top 2 of team, fully covered). Standouts get internship referrals even without winning.

### Strategic implications (read this twice)
1. **40% of marks = what was built.** A deep, working product beats a shallow gimmick. Full-stack + AI pipeline + gamification + polish = 20-mark play.
2. **20% = creativity.** With 100+ teams, "AI travel chatbot" #37 gets lost. We need a concept with a BUILT-IN story.
3. **20% = travel connection.** The product must be ABOUT travel at its core — the more specific and genuine, the better.
4. **Demo (5) + execution (5) = 10 marks of pure reliability.** This is where teams DIE at 8 AM (dead laptop, venue wifi, API outage). We engineer demo-safety as a feature.
5. **Meta-storytelling is free points.** The event is called LAYOVER. If our product is literally about layovers, the pitch opens itself.

---

## 2. PRODUCT DIRECTION

### 🏆 RECOMMENDED: "LAYOVER — Turn your layover into an adventure"
**One-liner**: Type your airport + layover duration → AI generates a timed micro-adventure plan (missions), rendered as a gorgeous collectible boarding pass, with passport stamps, an AI-generated postcard, and a gate-announcement voice intro.

**Why this wins:**
- **Meta-story**: "We came to LAYOVER, so we built LAYOVER." Zero-explanation pitch opener. Judges remember us in deliberation.
- **Travel-core (10/10)**: The product is about the most ignored slice of travel — the in-between hours. Genuine, not bolted-on.
- **Creativity (10/10)**: "Missions, not itineraries" framing + collectible stamps + postcards. Useful AND delightful — straddles both vibes the judges explicitly welcome.
- **What was built (20/20)**: Full-stack app — input flow → AI generation pipeline → visual boarding pass → gamified stamps → share cards → database of adventures. Deep enough to defend.
- **Demo (5/5)**: Judge types THEIR home airport + "2 hours" → a personalized adventure generates LIVE in ~10 seconds. Instant emotional hook.

**Core demo loop (60 seconds):**
1. Landing: animated departure board flips "WHERE TO NEXT?"
2. Input: airport combobox (DXB) + duration slider (5h 20m) + vibe picker
3. LIVE generation: streaming mission plan (timed, realistic, security-buffer aware)
4. Reveal: boarding-pass card slides in with missions, map, barcode
5. Complete a mission → ink-stamp SLAMS onto the passport (satisfying sound + animation)
6. AI postcard generated + TTS gate announcement plays ("Now boarding: adventure at Gate D4…")

**Feature layers (built tonight, in priority order):**
- L1 (must): input flow → AI plan → boarding pass card → mission timeline
- L2 (should): stamps/gamification, demo mode, postcard image gen
- L3 (nice): TTS announcement, share/save card, "delay re-planner", airport sleep-score, multi-leg trips
- Physical artifact (booth magnet): printed boarding-pass postcards with QR code → the live app. Physical objects on a booth table = judges stop walking.

### Alternate directions (same base works for all — decision is reversible until ~7 PM)
- **Option B — "WINDOW SEAT"**: AI airplane-window simulator — any flight path renders the view outside your virtual window (time-of-day sun, clouds, landmarks en route). Weirder, hardware-optional (tablet in a cardboard window frame). Risk: shallow after 30 seconds.
- **Option C — "LOCALHOST"**: AI makes you a local of any city in 120 seconds (slang, transit hack, one hidden spot, one food rule). Charming, demo-friendly, but "local discovery" will be a crowded lane.
- All three share: airport data, boarding-pass UI system, AI routes, stamps, demo mode. **Pivoting tonight costs us ~20% of work, not 80%.**

---

## 3. THE BASE — what we build TODAY (before 5 PM check-in)

**Philosophy**: The base is a TOOLKIT (infrastructure, components, tested integrations, demo-safety systems). The PRODUCT (idea logic, content, gamification, polish, pitch) gets built tonight in the room. This is legitimate preparation per the FAQ, and honestly defensible if a judge asks "when was this built?"

### Architecture (Next.js 16 App Router, single-page experience)
```
src/
  app/
    page.tsx                 # tonight: the product experience
    api/
      ai/plan/route.ts       # POST → streaming mission-plan JSON (LLM)
      ai/postcard/route.ts   # POST → AI postcard image
      ai/announce/route.ts   # POST → TTS gate announcement (base64 audio)
      airports/route.ts      # GET ?q= → airport search (bundled dataset)
  components/
    departure-board.tsx      # split-flap animated hero (Sora + Space Mono)
    boarding-pass-card.tsx   # HERO: perforated, barcode, mission sections
    airport-combobox.tsx     # instant offline search over airport DB
    mission-timeline.tsx     # timed mission cards with duration chips
    stamp-badge.tsx          # SVG rubber-stamp with slam animation
    duration-slider.tsx, vibe-picker.tsx
  lib/
    airports.ts              # ~60 airports (IATA, city, country, tz) — offline
    ai-client.ts             # typed frontend wrappers, fetch with fallbacks
    demo-mode.ts             # pre-baked responses for DXB/SIN/CCJ/AMS
    plan-schema.ts           # zod schema for AI plan JSON
  prisma/schema.prisma       # Traveler, Trip, Mission, Stamp models
public/                     # favicon, og-image, printed-postcard assets
```

### Design system — "NIGHT TERMINAL"
- **Palette**: near-black background `#0B0B0D`, warm amber primary (departure-board amber `#F5A623` family), paper-cream cards `#F4EFE4` for boarding passes (contrast = premium), ink-black details. NO blue/indigo — deliberately distinctive in a sea of blue dashboards.
- **Type**: Sora (display) + Space Mono (codes, times, tickets) — echoes the event's own design language, subtly "in on the joke."
- **Signature components**:
  - Boarding pass: perforated edge via CSS radial-gradient cut-outs, dashed tear line, CSS barcode, IATA codes in huge mono
  - Split-flap departure board: per-character scramble animation, rows of "flights" (our features)
  - Stamps: rotated SVG badges, random rotation/ink colors, spring slam-in
- **Responsive**: mobile-first (judges WILL hold their phones up to it), 44px+ touch targets
- **Sticky footer** with build metadata (mono, tiny, charming: "LAYOVER v1 · built overnight · 6PM–6AM")

### AI pipeline (all backend, z-ai-web-dev-sdk, tested TODAY)
1. **/api/ai/plan**: LLM with strict JSON schema → `{ airport, durationMin, missions: [{ title, desc, durationMin, category, location, tip }], bufferMin, funFact }`. Temperature tuned for vivid-but-plausible. Streamed.
2. **/api/ai/postcard**: image gen "vintage travel postcard of {city}, {vibe}" → shown in card + printable.
3. **/api/ai/announce**: TTS: "Attention travellers: your {duration} layover adventure is now boarding…" → audio chip in the pass.
4. **Fallback chain (demo-safety)**: API timeout/error → demo-mode response (pre-baked, still streams with fake delay). Toggle in footer. **The 8 AM demo NEVER dies.**

### Database (Prisma + SQLite)
- `Traveler` (nickname) → `Trip` (airport, duration, vibe, planJson) → `Mission` (done flag) → `Stamp` (earned)
- Seeded with 3 demo trips. Powers: passport view, "trips completed" counter, gallery wall of tonight's adventures (great for booth storytelling: "every trip judges made tonight lives here").

### Today's build schedule (11:00 AM → 5:00 PM IST)
| Time | Task |
|---|---|
| 11:00–11:45 | User approves plan → lock product direction |
| 11:45–1:30 | Scaffold: theme, fonts, layout, departure board, design tokens |
| 1:30–2:30 | Airport dataset + combobox + plan-schema + Prisma models + db push |
| 2:30–3:30 | AI routes (plan, postcard, announce) + test each with curl |
| 3:30–4:30 | Boarding pass card + mission timeline + stamps components |
| 4:30–5:00 | Demo-mode + fallbacks + lint + browser verification + handoff doc |

---

## 4. TONIGHT'S BATTLE PLAN (6:00 PM → 9:30 AM)

| Time | Move |
|---|---|
| 5:00–6:00 | Check-in, claim corner seat near power, wifi test, git pull base, screenshot base for "progress proof" |
| 6:00–6:30 | Lock final twist (vibe check with mentors), write data flow on paper, create repo README |
| 6:30–8:30 | **L1**: wire input flow → plan API → boarding pass render. The spine, working end-to-end |
| 8:30–9:00 | Dinner. Eat. Hydrate. |
| 9:00–11:00 | **L2**: stamps + passport view + postcard + demo mode wiring. First full demo run at 11 PM |
| 11:00–12:30 | **L3**: TTS announcement, share card, micro-interactions, sound design |
| 12:30–2:00 | Hardening: error states, empty states, mobile pass-through, offline fallback test ×3 |
| 2:00–3:00 | Booth kit: print postcards, QR code, one-pager; deploy/verify local demo env |
| 3:00–4:00 | Pitch script + rehearse 2-min demo ×3 (timed!) + Round-1 30-sec pitch |
| 4:00–5:30 | Nap 20–30 min (set alarm), final smoke test, charge everything |
| 5:30–6:00 | Freeze features. Only bugfixes. Screenshot everything (progress evidence). |
| 7:00–8:00 | Round 1 booth: 30-sec pitch, hand judge the phone, stamp demo, give printed postcard |
| 8:15–9:00 | Round 2 (if shortlisted): "We came to LAYOVER, so we built LAYOVER…" |

### Round-1 pitch (30 seconds, memorized)
"Judges spend 60 seconds per project tonight — travelers spend 5 hours staring at departure boards. We came to LAYOVER, so we built LAYOVER: type any airport and your layover length, and our AI turns dead hours into a mission-based micro-adventure — timed around security buffers, stamped into a passport you collect forever. Try it — what's your home airport?"

### Round-2 pitch skeleton (2 minutes)
- 0:00 — Meta line + problem ("the dead hours of travel")
- 0:20 — LIVE: generate for a judge-chosen airport (or demo mode if wifi is nervous)
- 1:00 — Tour: missions → map → stamp → postcard → announcement audio
- 1:30 — "What we built tonight": stack line + build progress screenshots
- 1:50 — Closer: "Every layover deserves an adventure. LAYOVER — built overnight, at LAYOVER."

---

## 5. RISK REGISTER

| Risk | Mitigation |
|---|---|
| Venue wifi dies / AI API flakes at 8 AM | Demo mode with pre-baked streams; offline airport search; everything tested on phone hotspot too |
| Laptop dies overnight | Cloud git push every feature; demo also runs on phone (responsive) |
| API latency during live demo | Streaming UI shows progress theatrically ("CONTACTING GATE CONTROL…") — latency becomes showmanship |
| Judge: "didn't you pre-build this?" | Honest line: "We prepared a toolkit — components and AI integrations. Every feature you see was built tonight; here's our commit log." (Keep commits dense tonight!) |
| Idea feels too "useful" (crowded lane) | Stamps + postcards + announcement voice + weird fun-facts keep the "gloriously pointless" charm judges explicitly love |
| 2-min pitch overruns | Rehearse with timer ×3; demo mode removes typing latency |
| Solo/duo fatigue | 20-min nap scheduled; food breaks non-negotiable |

---

## 6. MARKS TRACEABILITY (every feature maps to the rubric)

| Feature | Rubric points |
|---|---|
| Full-stack app: DB, APIs, AI pipeline, streaming UI | What was built (20) |
| Meta-name, missions-not-itineraries, stamps/postcards | Creativity (10) |
| Product IS about the in-between of travel | Travel connection (10) |
| Fallbacks, error states, responsive, tested routes | Execution (5) |
| Live generation + stamp slam + audio + physical postcards | Demo & experience (5) |
