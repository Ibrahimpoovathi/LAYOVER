# LAYOVER — Explained in Plain English

> No technical words without a translation. If you can explain a restaurant, you can explain this site.

---

## 1. The big idea (30-second version)

Imagine you're stuck at an airport for 5 hours between two flights. Nothing to do. Boring walls, boring chairs, overpriced coffee.

Or you're on a **night bus from Kozhikode to Bengaluru — ten hours of ghat roads** and nothing to do. Same story, wheels instead of wings.

Now imagine a **travel-loving friend who knows every airport — and every bus route and railway line — on Earth**. You tell them: *"I'm at Dubai airport, I have 5 hours, and I feel like exploring."* They laugh and hand you a small list:

> 1. Go find the camel-milk gelato cart. Eat it. Judge it. (35 min)
> 2. Catch the sunset from the observation deck. (50 min)
> 3. Find the weirdest souvenir under 20 dirhams. (55 min)

That friend is this website. **You type the airport and your free hours — it hands you a mini-adventure list, printed like a beautiful boarding pass, and gives you stamps every time you complete a mission.**

And if you're on the bus or train instead? **Flip the big WINGS ⇄ WHEELS switch** — the whole site turns into a highway-sign world and hands you an old conductor's bus ticket instead: your journey becomes the adventure (more in section 2½).

---

## 2. What you see when you open the page (a walk-through)

**A) The big flip-board at the top.**
Old airports used boards with letters that physically flip and clack. Ours is a screen copy of that — letters flip around and show fun rows like "AI MISSIONS" and "GATE ANNOUNCEMENTS". It's there to make you smile and say "oh, this looks like a real terminal."

**B) The form (we call it the Flight Plan).**
Three questions, like a friendly check-in desk:
- **Where are you stuck?** — a search box. Type "Dub" and "Dubai (DXB)" appears. (The airport list is built *inside* the app, so it works even with no internet.)
- **How long are you stuck?** — a slider from 1 hour to 12 hours, with quick buttons like "3h" and "5h".
- **What's your mood?** — five buttons: Chill, Foodie, Explorer, Weird, Max Out. This changes *what kind* of adventures the list gives you.

**C) The big amber button: REQUEST ADVENTURE.**
You press it. A little panel appears with playful lines like *"CONTACTING GATE CONTROL…"* and *"NEGOTIATING WITH SECURITY…"* — partly to entertain you, partly because the AI genuinely needs a few seconds to think. We turned the waiting into part of the show.

**D) The boarding pass.**
A few seconds later, a paper-looking boarding pass slides in. It shows:
- An adventure title (like *"The Golden Hour Layover"*)
- Your route, written as a joke: **BED → DXB** (you start in bed, you end up in Dubai)
- Your mission list, each with a time (like "35 min"), a category icon (food, explore, weird…), and where exactly to go
- A fun fact about the airport at the bottom
- A barcode and stub, like a real ticket

**E) The stamps.**
Every mission has a "Complete" button. Press it and **a rubber stamp SLAMS onto the pass** with a little animation, rotated slightly, like a customs officer just stamped your passport. Press it again to undo. These stamps are saved — they're yours.

**F) The postcard and the announcement.**
Two extra buttons on the pass:
- **AI Postcard** — the site *paints* a vintage travel postcard of your airport. Takes ~30 seconds. You can screenshot it, print it, send it to your mom.
- **Gate Announcement** — the site *speaks*: a posh announcer voice welcomes you aboard your own adventure. Like the airport tannoy, but for fun.

**G) The Wall of Adventures (bottom of the page).**
Every adventure anyone generates gets pinned to a public wall at the bottom — like a corkboard of postcards in a hostel. Judges and visitors can see that real people used it tonight.

**H) The DEMO MODE switch (in the footer).**
A safety switch, explained in section 5.

---

## 2½. The second world: WHEELS (bus & train)

There's a switch at the top with two worlds on it: **✈ WINGS** and **🚌🚆 WHEELS**. Flip it and — like flipping a stage set — everything changes while the machinery underneath stays the same:

| | WINGS (✈) | WHEELS (🚌🚆) |
|---|---|---|
| The vibe | amber night airport terminal | green highway signs, hazard yellow, bitumen dark |
| The board | DEPARTURES | HIGHWAY ADVISORY ("NH-766 GHAT — 9 HAIRPINS — DRIVE SLOW") |
| You tell it | an airport + hours stuck | **where you board → where you roll into**, and bus or train |
| You get | a boarding pass (`BED → DXB`) | **an old bus ticket** — cream paper, red ink, "FARE: 4 CHAI + 2 PAROTTA" |
| The missions | airport missions | **journey stages**: boarding chaos, the nine hairpins, the meal halt, window-seat watching, arrival chai |
| Completing one | stamp SLAMS | conductor **punches a hole** in your ticket AND a stamp slams — because *your ticket is your passport* |
| The announcement | posh gate tannoy | the conductor calls your service to platform infinity |

The tricks stay identical: pick a mood, press the button, get a ticket, punch your stages, collect stamps, pin it on the wall. Try the demo journey **Kozhikode → Bengaluru** — it's the famous NH-766 ghat road with nine hairpins, and it's pre-baked so it works even if the venue wifi dies.

## 3. What actually happens when you press the button

Think of a restaurant:

1. **You place the order** — you picked Dubai, 5 hours, Explorer mood, and pressed the button.
2. **The waiter runs to the kitchen** — the website sends your order to its own "kitchen" (a small program living on the server side of the app).
3. **The chef texts a famous food writer** — the kitchen sends your order to an AI (a very well-read computer brain). But we don't let it ramble: we give it a **form to fill in** — "give me exactly a title, a fact, and 2–6 missions, each with a time, a place, and a category." Same form, every time.
4. **The teacher checks the homework** — when the AI replies, a strict checker (a rule-list in our code) inspects the answer: *Are there at least 2 missions? Is every mission between 15 and 300 minutes? Are the categories real ones?* If the AI got creative with the format, the homework is rejected.
5. **The kitchen fixes the plate anyway** — if the AI failed or took too long (we wait max ~48 seconds), the kitchen has **photocopied adventures in a drawer** (pre-written lists for Dubai, Singapore, Kozhikode, plus a generic one for anywhere). You still get a plate. You never see a "sorry, error" screen.
6. **The waiter brings the plate** — the finished adventure list travels back to your screen, and the website draws it as that paper boarding pass.
7. **The diary gets an entry** — a copy of your adventure is pasted into the app's **memory book** (its database). That's what powers the Wall of Adventures and your saved stamps.

So the loop is: **you order → kitchen asks AI → checker approves → pass is drawn → diary is updated → you stamp missions.**

---

## 4. The cast of characters behind the curtain

| Character (plain name) | Technical name | What it does, in one line |
|---|---|---|
| The Airport Phonebook | `src/lib/airports.ts` | 74 airports memorized — works with zero internet |
| The Creative Writer | AI via `z-ai-web-dev-sdk` | Writes your missions when you press the button |
| The Form We Force It To Fill | `src/lib/plan-schema.ts` | Guarantees the AI's answer always fits our boarding pass |
| The Teacher | zod (inside the schema file) | Checks the AI's homework before it reaches your screen |
| The Waiter | the API routes (`src/app/api/…`) | Carries orders to the kitchen and plates back to you |
| The Memory Book | SQLite database via Prisma | Remembers every trip, mission, and stamp — even after refresh |
| The Photo Studio | image AI (postcard route) | Paints the vintage postcard |
| The Announcer | text-to-speech (announce route) | Speaks the gate announcement |
| The Photocopies in the Drawer | `src/lib/demo-mode.ts` | Pre-written adventures used when the AI can't be reached |
| The Set Designer | `globals.css` design tokens | Makes everything look like a night terminal — dark, amber, paper |

---

## 5. "What if the internet dies?" — the three umbrellas

Hackathon demos die because of wifi. Ours can't, because we built three umbrellas:

1. **Umbrella 1 — The DEMO MODE switch.** Flip it in the footer, and the app skips the AI entirely and serves the pre-written adventures instantly. The pass gets a "TRAINING MODE" badge so we're honest about it.
2. **Umbrella 2 — The kitchen's drawer.** Even with the switch off, if the AI fails mid-request, the server quietly swaps in a pre-written adventure. The button *never* shows an error to a visitor.
3. **Umbrella 3 — The phonebook is memorized.** Searching airports doesn't touch the internet at all — the whole list ships inside the app.

Worst case scenario at a demo: no wifi, no AI — you still get a full, beautiful, stampable adventure in under a second.

---

## 6. A tiny map of the whole journey

```
 YOUR SCREEN                    THE KITCHEN (server)              OUTSIDE HELP
┌──────────────┐   order    ┌───────────────────────┐   ask    ┌─────────────┐
│ pick airport │ ─────────► │ waiter (api/ai/plan)  │ ───────► │ AI writer   │
│ pick hours   │            │  · checks the order   │          └─────┬───────┘
│ pick mood    │            │  · 48s patience limit │                │ reply
└──────┬───────┘            │  · teacher checks it  │ ◄──────────────┘
       │                    └─────────┬─────────────┘
       │ the pass              if AI failed: uses photocopies (demo plans)
       ▼                              │
┌──────────────┐                     ▼
│ boarding pass│ ◄──────────  ┌───────────────────┐
│ + stamps     │   plate out  │ memory book (DB)  │◄── every trip & stamp saved
└──────┬───────┘              └───────────────────┘
       ▼
  WALL OF ADVENTURES (everyone's trips pinned at the bottom)
```

Side doors off the same kitchen: **postcard route** (asks the photo studio) and **announce route** (asks the announcer for a voice clip).

---

## 7. Questions people actually ask

**"Is the AI just making stuff up?"**
It's making *fun* stuff up inside strict rules — the missions must fit your real time window, include a food mission, have realistic airport locations, and pass the format check. Plausible, doable, playful.

**"Where do my stamps go when I refresh the page?"**
The memory book (database). Each completed mission quietly asks the server "please mint a stamp for mission #3," and it's still there tomorrow.

**"Why does it say TRAINING MODE?"**
You (or the situation) are on demo mode — you got a pre-written adventure instead of a fresh AI one. Same fun, zero internet required.

**"Why a boarding pass and not just a list?"**
Because a list is forgettable and a *ticket* is a souvenir. The whole point of the app is turning dead time into a story you keep — the paper look, the stamps, the postcard, all serve that.

**"What was built before the hackathon vs during it?"**
Before: the toolkit — the design system, all components, the AI plumbing, the database, the backup systems (this "kitchen and dining room"). During the hackathon: the product itself — the adventure content, the gamification, the polish, the show (see `HACKATHON-NIGHT.md`).

---

*For the technical version of all of this: `README.md` (overview) and `docs/features/` (one deep-dive per subsystem).*
