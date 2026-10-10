import { Plan } from "./plan-schema";

/**
 * DEMO MODE — the 8 AM insurance policy.
 * If gate control (the AI API) is unreachable at judging time, these
 * pre-baked plans still stream theatrically. Never demo on hope.
 */

export const DEMO_PLANS: Record<string, Plan> = {
  DXB: {
    adventureTitle: "The Golden Hour Layover",
    airport: { iata: "DXB", city: "Dubai", country: "UAE" },
    vibe: "explorer",
    totalDurationMin: 320,
    bufferMin: 90,
    funFact:
      "DXB is so big it has its own weather — terminal 3 could fit 43 Airbus A380s nose to tail.",
    missions: [
      {
        title: "Camel-milk gelato recon",
        description:
          "Terminal 2's quiet corner cart sells camel-milk gelato. Order the saffron scoop. Rate it out of 10 like a serious judge.",
        durationMin: 35,
        category: "eat",
        location: "T2 food court, corner cart",
        tip: "Cash only. Bring small notes.",
      },
      {
        title: "The observation deck sunset run",
        description:
          "Take the inter-terminal train, clear security-lite, and catch the desert sun bounce off the apron from the deck near gate B.",
        durationMin: 50,
        category: "explore",
        location: "Terminal 3, Concourse B deck",
        tip: "Best light is 40 minutes before sundown.",
      },
      {
        title: "Snooze-bay zero-G test",
        description:
          "Book a 40-minute nap pod near the A concourse. Test the 'zero gravity' recline setting. Document findings honestly.",
        durationMin: 45,
        category: "rest",
        location: "Sleep-n-fly pods, Concourse A",
      },
      {
        title: "The midnight souk shuffle",
        description:
          "Duty-free counts as a souk if you commit. Find the weirdest edible souvenir under 20 dirhams. Bonus: gold ATMs exist here — just look.",
        durationMin: 55,
        category: "weird",
        location: "Duty-free marquee, T3",
        tip: "The gold ATM dispenses actual coins.",
      },
    ],
  },
  SIN: {
    adventureTitle: "Operation: Jewel Drop",
    airport: { iata: "SIN", city: "Singapore", country: "Singapore" },
    vibe: "maxout",
    totalDurationMin: 260,
    bufferMin: 75,
    funFact:
      "Changi's indoor waterfall, the Rain Vortex, drops 40 metres — the tallest indoor waterfall on Earth.",
    missions: [
      {
        title: "Rain Vortex speedrun",
        description:
          "Take the skytrain to Jewel. Touch the railing nearest the waterfall for luck, film a 10-second slow-mo, and get back before your legs believe it.",
        durationMin: 60,
        category: "explore",
        location: "Jewel, level 1 viewing",
        tip: "Skytrain airside access only for T1-T3; transit travelers may need to clear immigration.",
      },
      {
        title: "Kaya toast verdict",
        description:
          "Order kaya toast + soft eggs + kopi at the 24h bakery. The toast must be dunked. Issue a one-line verdict like a food critic who is very sleepy.",
        durationMin: 30,
        category: "eat",
        location: "T3 basement food court",
      },
      {
        title: "Rooftop pool spectating",
        description:
          "You can't swim without booking, but the deck bar lets you watch people swim on top of an airport. Absorb this fact fully.",
        durationMin: 25,
        category: "chill",
        location: "Aerotel bar, T1",
      },
      {
        title: "Free Singapore tour check",
        description:
          "If your layover is 5.5h+, the free 2-hour city tour exists. Find the desk, confirm eligibility, and report back with departure time.",
        durationMin: 20,
        category: "move",
        location: "T3 transit, tour desk",
      },
    ],
  },
  CCJ: {
    adventureTitle: "The Kozhikode Night Shift",
    airport: { iata: "CCJ", city: "Kozhikode", country: "India" },
    vibe: "foodie",
    totalDurationMin: 200,
    bufferMin: 60,
    funFact:
      "Kozhikode is a UNESCO City of Literature — and claims the original 'calico' cotton in its name.",
    missions: [
      {
        title: "Sulaimani tea ceremony",
        description:
          "Find the tiny canteen counter and order sulaimani — spiced black tea with lemon. Sip slowly like you have nowhere to be. You don't.",
        durationMin: 25,
        category: "eat",
        location: "Departures canteen counter",
      },
      {
        title: "Banana chips procurement",
        description:
          "Acquire one packet of Kerala banana chips from the snack shelf. Crunch loudly. This is the local marimba.",
        durationMin: 15,
        category: "weird",
        location: "Terminal snack kiosk",
      },
      {
        title: "Runway-edge star check",
        description:
          "Near the big window bays, count how many aircraft you can see with lights off. Bonus: name a constellation over the Arabian Sea approach path.",
        durationMin: 30,
        category: "chill",
        location: "Window bays, gates 1-2",
      },
      {
        title: "Malappuram seat marathon",
        description:
          "Test every chair type in the terminal (plastic, bench, recliner). Crown the champion. Write its name on your hand.",
        durationMin: 25,
        category: "explore",
        location: "All over the terminal",
        tip: "The window ledge counts as a chair if you are brave.",
      },
    ],
  },
};

/** Generic fallback for airports without a bespoke demo plan. */
export function genericDemoPlan(iata: string, city: string, country: string, vibe: string): Plan {
  return {
    adventureTitle: `The ${city} Dead-Hour Circuit`,
    airport: { iata, city, country },
    vibe,
    mode: "air",
    totalDurationMin: 240,
    bufferMin: 75,
    funFact: `${city} handles thousands of connections a day — and almost nobody looks out the window. You will.`,
    missions: [
      {
        title: "The best window in the terminal",
        description: `Find ${city}'s finest window seat with a runway view. Defend your choice with one solid reason. Airside architecture appreciation begins now.`,
        durationMin: 30,
        category: "chill",
        location: "Gate area window bays",
      },
      {
        title: "Local flavor requisition",
        description: `Hunt the most regional snack or drink in the terminal. One bite, one verdict, one story to steal for later.`,
        durationMin: 35,
        category: "eat",
        location: "Food court / café row",
        tip: "Whatever the staff snack on, order that.",
      },
      {
        title: "The walking lap record",
        description: `Walk one full loop of the concourse. Count the water fountains. Set your personal ${city} lap record to beat on the way back.`,
        durationMin: 40,
        category: "move",
        location: "Concourse loop",
      },
      {
        title: "Gate nap experiment",
        description: "Find the quietest corner, set a 25-minute alarm, and conduct a serious nap. Success is measured in grogginess units.",
        durationMin: 30,
        category: "rest",
        location: "Quiet zone / less-used gates",
      },
    ],
  };
}

// ─────────────────────────────────────────────
// ROAD MODE — bus stands, highway halts, dhaba diplomacy.
// The missions engine is identical; only the world changes.
// ─────────────────────────────────────────────

export const ROAD_DEMO_PLANS: Record<string, Plan> = {
  KBS: {
    adventureTitle: "The Mavoor Road Miniseries",
    airport: { iata: "KBS", city: "Kozhikode", country: "India" },
    vibe: "foodie",
    mode: "road",
    totalDurationMin: 240,
    bufferMin: 60,
    funFact:
      "The Mavoor Road KSRTC stand probably moves more humans in a day than CCJ airport does in a month — nobody counts, everybody knows.",
    missions: [
      {
        title: "Sulaimani summit",
        description:
          "Locate the stand's tea counter and order sulaimani — spiced black tea with lemon. Hold the glass, feel the history, sip like a conductor between shifts.",
        durationMin: 20,
        category: "eat",
        location: "Stand canteen / tea counter",
        tip: "Strong, lemony, slightly sweet. No sugar extra needed.",
      },
      {
        title: "Bay board bingo",
        description:
          "Copy three destination names off the main route board that you cannot pronounce on the first try. Award yourself one point per tongue-twister.",
        durationMin: 20,
        category: "explore",
        location: "Main enquiry / route board",
      },
      {
        title: "Window seat census",
        description:
          "Evaluate the people-watching seats on the Mavoor Road edge. Crown the champion seat. Defend your thesis to at least one auto driver.",
        durationMin: 30,
        category: "chill",
        location: "Roadside seating row",
      },
      {
        title: "The last-row legend",
        description:
          "Find a parked bus with its door open, climb to the last row, and sit there for one full song length. Report the seat's vibes honestly.",
        durationMin: 25,
        category: "weird",
        location: "Any parked KSRTC bus",
        tip: "Ask the cleaner first — they always say yes, sometimes for a fee.",
      },
    ],
  },
  MJS: {
    adventureTitle: "Operation Majestic",
    airport: { iata: "MJS", city: "Bengaluru", country: "India" },
    vibe: "maxout",
    mode: "road",
    totalDurationMin: 260,
    bufferMin: 75,
    funFact:
      "Majestic is so vast that buses leaving right now may outrun buses that left an hour ago — the stand eats timetables for breakfast.",
    missions: [
      {
        title: "Platform census",
        description:
          "Count the platforms without asking anyone. Then ask a porter the real number and absorb the difference quietly.",
        durationMin: 25,
        category: "explore",
        location: "Main concourse, Kempegowda BS",
      },
      {
        title: "The set-dosa sprint",
        description:
          "Find the busiest tiffin stall. Order set dosa with extra sagu. Time yourself: happy verdicts take at least eight minutes.",
        durationMin: 30,
        category: "eat",
        location: "Tiffin row near exits",
        tip: "Stand where the crowd is; empty stalls are red flags in Majestic.",
      },
      {
        title: "Interstate rig spotting",
        description:
          "Spot buses from five different states. Photograph nothing. Write the states on your hand like a serious spotter.",
        durationMin: 35,
        category: "weird",
        location: "Bus bays, all platforms",
      },
      {
        title: "Conductor's choice chai",
        description:
          "Ask a conductor where THEY drink chai. Go there. Order whatever they order. Overpay happily.",
        durationMin: 20,
        category: "rest",
        location: "Wherever the crew goes",
      },
    ],
  },
};

/** Generic road fallback for stops without a bespoke demo plan. */
export function genericRoadPlan(iata: string, city: string, country: string, vibe: string): Plan {
  return {
    adventureTitle: `The ${city} Roadside Circuit`,
    airport: { iata, city, country },
    vibe,
    mode: "road",
    totalDurationMin: 240,
    bufferMin: 75,
    funFact: `Every hour, hundreds of buses roll through ${city} — and nearly everyone stares at their phone. Today, you stare at the road.`,
    missions: [
      {
        title: "The bay-lap record",
        description: `Walk one full loop of the ${city} stand or plaza. Count the tea stalls. Set a lap record to defend before your bus leaves.`,
        durationMin: 35,
        category: "move",
        location: "Full perimeter of the stand",
      },
      {
        title: "Dhaba diplomacy",
        description: "Order exactly what the truck drivers are having. Eat it standing up if they do. Verdict mandatory.",
        durationMin: 35,
        category: "eat",
        location: "Busiest food stall / dhaba",
        tip: "The dish with the biggest steel pot is the right answer.",
      },
      {
        title: "Windshield cinema",
        description: "Find a seat facing the road. Watch departures like a film. Narrate one bus's entire journey in your head.",
        durationMin: 30,
        category: "chill",
        location: "Road-facing bench / window seat",
      },
      {
        title: "The stranger's route",
        description: "Ask one traveler where they're headed and one thing they'd do there. Steal that idea for your own list.",
        durationMin: 25,
        category: "weird",
        location: "Platform / waiting area",
        tip: "The waiting-to-board crowd is friendlier than the just-arrived crowd.",
      },
    ],
  };
}

// ─────────────────────────────────────────────
// WHEELS JOURNEYS — bus & train routes, keyed "ORIGIN>DEST".
// The dead hours ARE the ride: boarding, meal halts, ghat
// sections, junction waits, arrival chai.
// ─────────────────────────────────────────────

export const WHEELS_DEMO_JOURNEYS: Record<string, Plan> = {
  "KBS>MJS": {
    adventureTitle: "The Nine Hairpins Special",
    airport: { iata: "KBS", city: "Kozhikode", country: "India" },
    vibe: "foodie",
    mode: "road",
    vehicle: "bus",
    destination: { city: "Bengaluru", code: "MJS" },
    routeCode: "NH-766 · VIA WAYANAD GHAT",
    fareJoke: "4 CHAI + 2 PAROTTA",
    totalDurationMin: 600,
    bufferMin: 90,
    funFact:
      "NH-766 climbs the Wayanad ghat through exactly nine hairpin bends — drivers downshift at number one and don't see top gear again until Mysuru.",
    missions: [
      {
        title: "Bay-13 boarding recon",
        description:
          "Find your actual bus among the Mavoor Road chaos. Confirm with the checker, locate the luggage hatch, and claim the window before destiny does.",
        durationMin: 30,
        category: "move",
        location: "KBS departures bays",
        tip: "The checker's nod beats any app.",
      },
      {
        title: "Nine hairpins countdown",
        description:
          "At the Lakkidi climb, count every hairpin out loud. Award the sharpest bend a name. At number nine, salute the valley.",
        durationMin: 45,
        category: "chill",
        location: "ON BOARD · Wayanad ghat section",
      },
      {
        title: "Kalpetta meal-halt diplomacy",
        description:
          "At the halt, skip the fancy board. Order whatever the driver orders, on banana leaf if offered, and finish before the horn.",
        durationMin: 40,
        category: "eat",
        location: "Kalpetta highway restaurant",
        tip: "Meals-race rules: the horn is the finish line.",
      },
      {
        title: "Mysuru midnight chai",
        description:
          "During the Mysuru stop, sprint (walk briskly) for cutting chai. Compare it to the Kozhikode sulaimani in exactly one sentence.",
        durationMin: 25,
        category: "rest",
        location: "Mysuru halt, tea trolley",
      },
      {
        title: "The bus-TV film review",
        description:
          "If the overhead TV plays a movie at volume 11, write a three-word review of it. Deliver it to your neighbor at arrival. Award yourself stars.",
        durationMin: 30,
        category: "weird",
        location: "ON BOARD · aisle seat",
        tip: "'Stunt. Rain. Reunion.' — 4 stars.",
      },
    ],
  },
  "CLT>TVC": {
    adventureTitle: "The Coastal Line Window Claim",
    airport: { iata: "CLT", city: "Kozhikode", country: "India" },
    vibe: "explorer",
    mode: "road",
    vehicle: "train",
    destination: { city: "Thiruvananthapuram", code: "TVC" },
    routeCode: "COASTAL LINE · KERALA",
    fareJoke: "3 CHAI + 1 VADA",
    totalDurationMin: 330,
    bufferMin: 75,
    funFact:
      "The Kerala coastal line crosses more than 20 rivers and backwater channels between Kozhikode and Thiruvananthapuram — a bridge roughly every 15 minutes.",
    missions: [
      {
        title: "Platform-1 reconnaissance",
        description:
          "Check the coach-position board, predict where your coach will halt, then verify your theory against reality. Score your accuracy honestly.",
        durationMin: 20,
        category: "explore",
        location: "CLT platform 1",
      },
      {
        title: "The window-seat manifesto",
        description:
          "Claim the window, adjust the shutter to 40% open, and declare this seat your office for the next five hours. One paragraph manifesto.",
        durationMin: 20,
        category: "chill",
        location: "ON BOARD · window seat",
      },
      {
        title: "Backwater bridge census",
        description:
          "Count bridges over backwaters and rivers. For each, note the color of the water. Predict your total before arrival — closest guess wins eternal glory.",
        durationMin: 50,
        category: "explore",
        location: "ON BOARD · after Kallayi",
      },
      {
        title: "Junction-halt chai sprint",
        description:
          "At a long halt (Ernakulam or Kollam), hop out for platform chai in the classic glass tumbler. Reboard before the guard's whistle becomes real.",
        durationMin: 20,
        category: "eat",
        location: "Junction platform tea stall",
        tip: "Two-minute halt = no chai. Fifteen-minute halt = chai speedrun.",
      },
      {
        title: "Vada verdict at km 200",
        description:
          "Buy one vada from the platform vendor who boards at a small station. Rate crunchiness, grease, and pepper on a serious scorecard.",
        durationMin: 25,
        category: "weird",
        location: "ON BOARD · vendor aisle",
      },
    ],
  },
  "BOM>PNQ": {
    adventureTitle: "Expressway Windmill Grand Prix",
    airport: { iata: "BOM", city: "Mumbai", country: "India" },
    vibe: "maxout",
    mode: "road",
    vehicle: "bus",
    destination: { city: "Pune", code: "PNQ" },
    routeCode: "MUMBAI-PUNE EXPRESSWAY",
    fareJoke: "2 CUTTING + 1 VADA PAV",
    totalDurationMin: 240,
    bufferMin: 60,
    funFact:
      "The Mumbai-Pune Expressway was India's first six-lane concrete expressway — its tunnels are so long drivers flick headlights inside like a signal language.",
    missions: [
      {
        title: "Tunnel drumroll protocol",
        description:
          "Inside the first tunnel, count seconds to the exit. If longer than 30, conduct an imaginary orchestra to the engine rhythm.",
        durationMin: 20,
        category: "weird",
        location: "ON BOARD · tunnel section",
      },
      {
        title: "Food-mall verdict",
        description:
          "At the expressway food mall, pick between vada pav and misal in under 90 seconds. Commit fully. No regrets past the toll.",
        durationMin: 35,
        category: "eat",
        location: "Expressway food mall",
      },
      {
        title: "Windmill armchair count",
        description:
          "Spot the windmill farm on the ridge. Count turbines, then invent a wind-speed reading from how fast they spin. Publish your forecast.",
        durationMin: 25,
        category: "explore",
        location: "ON BOARD · ridge stretch",
      },
      {
        title: "Arrival chai touchdown",
        description:
          "Before Pune arrivals chaos, plan your first chai stop and your first route out. Land the journey like a pilot: smooth, announced, triumphant.",
        durationMin: 30,
        category: "rest",
        location: "PNQ arrival bay",
      },
    ],
  },
};

/** Known-route highway flavor for the ticket chip (originCode>destCode). */
export const ROUTE_FLAVOR: Record<string, string> = {
  "KBS>MJS": "NH-766 · VIA WAYANAD GHAT",
  "KBS>MYS": "NH-766 · WAYANAD GHAT",
  "CLT>TVC": "COASTAL LINE · KERALA",
  "CLT>ERS": "COASTAL LINE · MALABAR",
  "BOM>PNQ": "MUMBAI-PUNE EXPRESSWAY",
  "VYT>THP": "NH-66 · COASTAL RUN",
};

/** Generic WHEELS journey fallback for any origin→destination pair. */
export function genericWheelsPlan(
  originCode: string,
  originCity: string,
  country: string,
  destCode: string,
  destCity: string,
  vehicle: "bus" | "train",
  vibe: string
): Plan {
  const isTrain = vehicle === "train";
  const craft = isTrain ? "coach" : "last row";
  const haltWord = isTrain ? "junction halt" : "meal halt";
  return {
    adventureTitle: `The ${originCity} → ${destCity} Dead-Hour Run`,
    airport: { iata: originCode.slice(0, 3).padEnd(3, "X"), city: originCity, country },
    vibe,
    mode: "road",
    vehicle,
    destination: { city: destCity, code: destCode.slice(0, 6) },
    routeCode: ROUTE_FLAVOR[`${originCode}>${destCode}`] ?? (isTrain ? "RAIL · EXPRESS" : "NH-∞"),
    fareJoke: isTrain ? "3 CHAI + 1 VADA" : "4 CHAI + 2 PAROTTA",
    totalDurationMin: 360,
    bufferMin: 90,
    funFact: `Every day, thousands ride ${originCity} to ${destCity} and call it wasted time. Tonight it's a mission map.`,
    missions: [
      {
        title: isTrain ? "Platform politics" : "Boarding-bay chess",
        description: isTrain
          ? "Decode the coach-position board, stake your spot early, and defend it with the calm of a 20-year commuter."
          : "Find the right bay among the chaos, confirm with the checker, and learn one fact about your bus from the cleaner.",
        durationMin: 30,
        category: "move",
        location: `${originCity} ${isTrain ? "platform" : "boarding bay"}`,
      },
      {
        title: isTrain ? "Window-seat manifesto" : "The last-row throne",
        description: isTrain
          ? `Claim a window in your ${craft}, set the shutter to exactly 40% open, and write a one-line manifesto for the ride.`
          : `Take the ${craft}, test every recline stage, and crown the best one. The back row sees the whole film of the road.`,
        durationMin: 40,
        category: "chill",
        location: "ON BOARD",
      },
      {
        title: isTrain ? "Junction chai speedrun" : "Dhaba diplomacy",
        description: isTrain
          ? "At the longest halt, hop off for chai in the local tumbler. Reboard with 60 seconds to spare and a story."
          : "Order exactly what the driver orders at the halt. Extra credit if it arrives on a banana leaf.",
        durationMin: 35,
        category: "eat",
        location: `${haltWord} stop`,
        tip: "The busiest stall is the right stall.",
      },
      {
        title: "Arrival-ceremony plans",
        description: `Before ${destCity} swallows you, choose your first chai stop and the one thing you'd tell the next traveler. Write both down.`,
        durationMin: 25,
        category: "weird",
        location: "ON BOARD · final stretch",
      },
    ],
  };
}

/** Theatrical status lines for the generation overlay. */
export const GATE_CONTROL_LINES = [
  "CONTACTING GATE CONTROL…",
  "NEGOTIATING WITH SECURITY…",
  "SCOUTING TERMINAL SECRETS…",
  "BRIEFING YOUR GUIDE…",
  "STAMPING DOCUMENTS…",
  "FILING FLIGHT PLAN…",
];

/** Split a plan into pseudo-streaming JSON chunks (mimics LLM streaming). */
export function fakeStreamChunks(plan: Plan, chunks = 24): string[] {
  const json = JSON.stringify(plan, null, 2);
  const size = Math.ceil(json.length / chunks);
  const out: string[] = [];
  for (let i = 0; i < json.length; i += size) out.push(json.slice(i, i + size));
  return out;
}
