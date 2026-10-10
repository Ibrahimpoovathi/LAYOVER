"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plane,
  Bus,
  TrainFront,
  Megaphone,
  MailOpen,
  RotateCcw,
  ShieldCheck,
  WifiOff,
  Loader2,
  ArrowRight,
  Download,
  Award,
  Timer,
  RefreshCw,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DepartureBoard, SplitFlapText, type BoardRow } from "@/components/terminal/departure-board";
import { LedAdvisory } from "@/components/terminal/led-advisory";
import { WorldTransition } from "@/components/terminal/world-transition";
import { CostGuardChip } from "@/components/terminal/cost-guard-chip";
import { AirportCombobox } from "@/components/terminal/airport-combobox";
import { ModeSwitch } from "@/components/terminal/mode-switch";
import { ThemeToggle } from "@/components/terminal/theme-toggle";
import { DurationSlider } from "@/components/terminal/duration-slider";
import { VibePicker } from "@/components/terminal/vibe-picker";
import { AccessPicker } from "@/components/terminal/access-picker";
import { LedCaptionStrip } from "@/components/terminal/led-caption-strip";
import { GenerationStatus } from "@/components/terminal/generation-status";
import { CrewChip, type Crew } from "@/components/terminal/crew-login";
import { Leaderboard } from "@/components/terminal/leaderboard";
import { BoardingPassCard } from "@/components/terminal/boarding-pass-card";
import { BusTicketCard } from "@/components/terminal/bus-ticket-card";
import { type Airport } from "@/lib/airports";
import {
  type Plan,
  type Mission,
  type VibeId,
  type VehicleId,
  type AccessProfileId,
  CATEGORY_META,
  fmtDuration,
} from "@/lib/plan-schema";
import {
  SIM_RATE,
  missionWindows,
  missionPhase,
  missionBoardStatus,
  fmtJourneyClock,
} from "@/lib/mission-clock";
import { genericDemoPlan, genericRoadPlan, genericWheelsPlan } from "@/lib/demo-mode";
import { MODE_META, type TransportMode } from "@/lib/modes";

type Step = "idle" | "generating" | "ready";

const BOARD_ROWS: BoardRow[] = [
  { code: "LY-101", dest: "AI MISSIONS", info: "GATE CONTROL ENGINE", status: "BOARDING", tone: "green" },
  { code: "LY-102", dest: "PASSPORT STAMPS", info: "GATE B7 · INK READY", status: "ON TIME" },
  { code: "LY-103", dest: "AI POSTCARDS", info: "THE POSTCARD PRESS", status: "ON TIME" },
  { code: "LY-104", dest: "GATE ANNOUNCEMENTS", info: "TTS TOWER", status: "BOARDING", tone: "green" },
  { code: "LY-105", dest: "DEMO MODE", info: "DEAD-WIFI INSURANCE", status: "STANDBY" },
  { code: "LY-106", dest: "ADVENTURE", info: "EVERY LAYOVER WINS", status: "FINAL CALL", tone: "red" },
];

const TICKER =
  "✦ LAYOVER ✦ TURN DEAD HOURS INTO ADVENTURES ✦ TIMED · STAMPED · UNFORGETTABLE ✦ EVERY LAYOVER IS A STORY ✦ ";

// world-swap choreography: the wheel/plane runs ~1.1s; data-mode flips the
// moment the vehicle crosses mid-screen, and colors crossfade underneath.
const SWEEP_MS = 1250;
const FLIP_MS = 420;

const WHEELS_TICKER =
  "✦ LAYOVER WHEELS ✦ NH-66 COASTAL RUN ✦ VENDE BHARAT ✦ DHABA OPEN ALL NIGHT ✦ HORN OK PLEASE ✦ SAME ENGINE · NEW ROADS ✦ ";

interface WallTrip {
  id: string;
  iata: string;
  city: string;
  adventureTitle: string;
  mode?: string;
  vehicle?: string | null;
  destination?: string | null;
  routeCode?: string | null;
  accessProfile?: string | null;
  nickname?: string | null;
  missionsTotal: number;
  missionsDone: number;
  source: string;
}

export default function Home() {
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("idle");
  const [airport, setAirport] = useState<Airport | null>(null);
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [vehicle, setVehicle] = useState<VehicleId>("bus");
  const [duration, setDuration] = useState(240);
  const [vibe, setVibe] = useState<VibeId>("explorer");
  const [accessProfile, setAccessProfile] = useState<AccessProfileId>("none");
  const [demoMode, setDemoMode] = useState(false);
  const [mode, setMode] = useState<TransportMode>("air");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [source, setSource] = useState<string>("ai");
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [nickname, setNickname] = useState("gate-crasher");
  const [missionIds, setMissionIds] = useState<(string | undefined)[]>([]);
  const [wall, setWall] = useState<WallTrip[]>([]);

  // ── CREW GATE — logged-in identity; badges bank to this account ──
  const [crew, setCrew] = useState<Crew | null>(null);
  // bumped whenever a badge (stamp) is earned — refreshes the leaderboards
  const [boardTick, setBoardTick] = useState(0);
  // USP-A demo clock — journey minutes elapsed since the plan was issued
  const [clockMin, setClockMin] = useState(0);
  const scrubbedSeenRef = useRef<Set<number>>(new Set());

  const [announcing, setAnnouncing] = useState(false);
  const [annCaption, setAnnCaption] = useState<string | null>(null);
  const [postcardLoading, setPostcardLoading] = useState(false);
  const [postcardUrl, setPostcardUrl] = useState<string | null>(null);
  const [postcardFallback, setPostcardFallback] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const sweepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // world-swap choreography: "to-road" = wheel roll, "to-air" = plane flythrough
  const [sweep, setSweep] = useState<"to-road" | "to-air" | null>(null);

  // mode registry lookups — the pass/ticket always renders in ITS OWN mode,
  // the switch only decides what gets generated next.
  const meta = MODE_META[mode];
  const tickerText = mode === "air" ? TICKER : WHEELS_TICKER;
  const planMode: TransportMode = (plan?.mode as TransportMode) ?? "air";
  const passMeta = MODE_META[planMode];

  function switchMode(m: TransportMode) {
    if (m === mode || sweep) return; // one world swap at a time
    setSweep(m === "road" ? "to-road" : "to-air");
    if (flipTimer.current) clearTimeout(flipTimer.current);
    if (sweepTimer.current) clearTimeout(sweepTimer.current);
    // the world flips mid-flight, as the wheel/plane crosses mid-screen
    flipTimer.current = setTimeout(() => {
      setMode(m);
      if (m === "road") {
        // fresh journey in the wheels world; keep the wings airport for the trip back
        setOrigin(null);
        setDestination(null);
      } else {
        setAirport((a) => (a && (a.mode ?? "air") === "air" ? a : null));
      }
    }, FLIP_MS);
    sweepTimer.current = setTimeout(() => setSweep(null), SWEEP_MS);
  }

  useEffect(
    () => () => {
      if (sweepTimer.current) clearTimeout(sweepTimer.current);
      if (flipTimer.current) clearTimeout(flipTimer.current);
    },
    [],
  );

  // the browser tab re-titles with the active world
  useEffect(() => {
    document.title =
      mode === "road"
        ? "LAYOVER WHEELS — Bus & Train Journeys · Highway Division"
        : "LAYOVER WINGS — Flight Layovers · Night Terminal";
  }, [mode]);

  // one-time traveler identity
  useEffect(() => {
    let n = localStorage.getItem("layover-nickname");
    if (!n) {
      n = `TRAVELER-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      localStorage.setItem("layover-nickname", n);
    }
    setNickname(n);
    // restore a crew session if this browser has one
    try {
      const raw = localStorage.getItem("layover-crew");
      if (raw) {
        const c = JSON.parse(raw) as Crew;
        if (c?.id && c?.nickname) setCrew(c);
      }
    } catch {
      /* no session — the gate is right there in the header */
    }
  }, []);

  function handleCrewLogin(c: Crew) {
    setCrew(c);
    try {
      localStorage.setItem("layover-crew", JSON.stringify(c));
    } catch {
      /* private mode — session lives for this tab only */
    }
    setBoardTick((t) => t + 1);
  }

  function handleCrewLogout() {
    setCrew(null);
    try {
      localStorage.removeItem("layover-crew");
    } catch {
      /* nothing to clear */
    }
    toast({ title: "OFF DUTY", description: "Badges keep their rank — new stamps won't bank until you log back in." });
  }

  const loadWall = useCallback(async () => {
    try {
      const res = await fetch("/api/trips?limit=10", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setWall(data.trips);
    } catch {
      /* wall is decorative — stay silent */
    }
  }, []);

  useEffect(() => {
    loadWall();
  }, [loadWall]);

  // ── USP-A "THE BOARD DEFENDS YOUR TIME" ──
  // One demo clock for the whole app: 1 real second = SIM_RATE journey
  // minutes. No scattered Date.now() — every window derives from clockMin.
  const clockRunning = step === "ready" && !!plan && demoMode;
  useEffect(() => {
    if (!clockRunning || !plan) return;
    const id = setInterval(() => {
      setClockMin((c) => Math.min(c + SIM_RATE, plan.totalDurationMin));
    }, 1000);
    return () => clearInterval(id);
  }, [clockRunning, plan]);

  const wins = useMemo(() => (plan ? missionWindows(plan) : []), [plan]);
  const phases = plan
    ? plan.missions.map((_, i) => missionPhase(wins[i], clockMin, !!done[i]))
    : [];
  const scrubbedMap: Record<number, boolean> = {};
  phases.forEach((p, i) => {
    if (p === "scrubbed") scrubbedMap[i] = true;
  });
  const scrubCount = Object.keys(scrubbedMap).length;

  // the board calls out every window it scrubs — once per mission per plan
  useEffect(() => {
    if (!plan) return;
    plan.missions.forEach((m, i) => {
      if (
        missionPhase(wins[i], clockMin, !!done[i]) === "scrubbed" &&
        !scrubbedSeenRef.current.has(i)
      ) {
        scrubbedSeenRef.current.add(i);
        toast({
          title: "WINDOW CLOSED",
          description: `The board scrubbed “${m.title}” — REPLAN files fresh adventures into the time you have left.`,
        });
      }
    });
  }, [clockMin, plan, done, wins, toast]);

  // live mission rows on the solari while a demo plan is on the clock:
  // ON TIME → BOARDING → FINAL CALL → SCRUBBED / DONE ✦, with flap animation
  const missionRows: BoardRow[] =
    plan && demoMode && step === "ready"
      ? plan.missions.map((m, i) => ({
          code: `M-${String(i + 1).padStart(2, "0")}`,
          dest: m.title.toUpperCase(),
          info: m.location.toUpperCase(),
          ...missionBoardStatus(phases[i]),
        }))
      : [];

  async function generate() {
    if (mode === "air" && !airport) {
      toast({
        title: "No airport selected",
        description: "Pick a layover airport first — even a pretend one.",
        variant: "destructive",
      });
      return;
    }
    if (mode === "road" && (!origin || !destination)) {
      toast({
        title: "Journey incomplete",
        description: "Pick where you board AND where you roll into — the road needs both ends.",
        variant: "destructive",
      });
      return;
    }
    if (mode === "road" && origin && destination && origin.iata === destination.iata) {
      toast({
        title: "That's a very short journey",
        description: "Origin and destination can't be the same stop. Even the conductor is confused.",
        variant: "destructive",
      });
      return;
    }

    const currentMode = mode;
    setStep("generating");
    setPostcardUrl(null);
    setPostcardFallback(false);
    setDone({});
    setClockMin(0);
    scrubbedSeenRef.current = new Set();

    try {
      const body =
        currentMode === "air"
          ? {
              iata: airport!.iata,
              city: airport!.city,
              country: airport!.country,
              durationMin: duration,
              vibe,
              accessProfile,
              mode: currentMode,
              forceDemo: demoMode,
            }
          : {
              iata: origin!.iata,
              city: origin!.city,
              country: origin!.country,
              destination: { city: destination!.city, code: destination!.iata },
              vehicle,
              durationMin: duration,
              vibe,
              accessProfile,
              mode: currentMode,
              forceDemo: demoMode,
            };

      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok || !data.plan) throw new Error(data.error ?? "Gate control went quiet");

      setPlan(data.plan);
      setSource(data.source ?? "ai");
      setStep("ready");
      if (data.source === "demo" && !demoMode) {
        toast({
          title: currentMode === "road" ? "Route control unreachable" : "Gate control unreachable",
          description: "Dispatched a backup adventure from the demo locker instead.",
        });
      }
      if (data.source === "showcase") {
        toast({
          title: "COST GUARD engaged",
          description: "Hourly AI budget spent — the demo locker is planning this one. Every feature still works, at zero spend.",
        });
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);

      // archive trip (fire & forget)
      saveTrip(data.plan, data.source);
    } catch {
      // total network failure → local demo plan so the show goes on
      let local: Plan;
      if (currentMode === "road" && origin && destination) {
        local = genericWheelsPlan(
          origin.iata,
          origin.city,
          origin.country,
          destination.iata,
          destination.city,
          vehicle,
          vibe
        );
      } else if (currentMode === "road" && origin) {
        local = genericRoadPlan(origin.iata, origin.city, origin.country, vibe);
      } else if (airport) {
        local = genericDemoPlan(airport.iata, airport.city, airport.country, vibe);
      } else {
        return;
      }
      setPlan(local);
      setSource("demo");
      setStep("ready");
      toast({
        title: "Running on internal power",
        description: "Network is down — the adventure continues regardless.",
      });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }

  async function saveTrip(p: Plan, src: string) {
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, travelerId: crew?.id, plan: p, source: src }),
      });
      const data = await res.json();
      if (data.ok && data.trip?.missions) {
        setMissionIds(data.trip.missions.map((m: { id: string }) => m.id));
      }
      loadWall();
      setBoardTick((t) => t + 1);
    } catch {
      /* archiving is best-effort */
    }
  }

  function toggleMission(i: number) {
    const next = { ...done, [i]: !done[i] };
    setDone(next);
    const missionId = missionIds[i];
    if (missionId) {
      fetch(`/api/missions/${missionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next[i] }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.ok && d.stamp && next[i]) {
            // badge banked — light up the boards
            setBoardTick((t) => t + 1);
            const label = CATEGORY_META[d.stamp.category as keyof typeof CATEGORY_META]?.label ?? d.stamp.category;
            toast({
              title: `BADGE EARNED · ${String(label).toUpperCase()}`,
              description: "Slammed into the passport — the leaderboard just moved.",
            });
          }
        })
        .catch(() => {});
    }
  }

  // USP-A REPLAN — the board found you a new window: keep everything you
  // stamped (and everything still inside its window), drop the scrubbed,
  // file fresh missions that fit the play time left. Deterministic pool,
  // no network — the replan is as offline-proof as the rest of the demo.
  function replan() {
    if (!plan) return;
    const winsNow = missionWindows(plan);
    const scrubbedIdx = new Set(
      plan.missions
        .map((_, i) => i)
        .filter((i) => missionPhase(winsNow[i], clockMin, !!done[i]) === "scrubbed"),
    );
    const kept: Mission[] = [];
    const keptDone: Record<number, boolean> = {};
    const keptIds: (string | undefined)[] = [];
    plan.missions.forEach((m, i) => {
      if (!scrubbedIdx.has(i)) {
        keptDone[kept.length] = !!done[i];
        keptIds.push(missionIds[i]);
        kept.push(m);
      }
    });

    const available = Math.max(plan.totalDurationMin - plan.bufferMin, 30);
    // the replan schedule starts from NOW. missionStarts compresses windows
    // into the remaining play time (same scaling the original plan uses), so
    // a fresh mission fits while the RAW schedule stays within 1.5× of the
    // minutes the clock still owes you.
    const remainingPlay = Math.max(available - clockMin, 15);
    const capacity = Math.round(remainingPlay * 1.5);
    let rawUsed = kept.reduce((s, m) => s + m.durationMin, 0);
    const pool = (planMode === "road"
      ? genericRoadPlan(plan.airport.iata, plan.airport.city, plan.airport.country ?? "", plan.vibe)
      : genericDemoPlan(plan.airport.iata, plan.airport.city, plan.airport.country ?? "", plan.vibe)
    ).missions.filter(
      // only missions still on the ticket are excluded — a scrubbed adventure
      // may earn a second window (the board gives second chances)
      (pm) => !kept.some((cm) => cm.title === pm.title),
    );

    const fresh: Mission[] = [];
    for (const pm of pool) {
      if (kept.length + fresh.length >= 6) break; // plan schema caps at 6 missions
      if (rawUsed + pm.durationMin <= capacity) {
        fresh.push(pm);
        rawUsed += pm.durationMin;
      }
    }

    setPlan({
      ...plan,
      missions: [...kept, ...fresh],
      // the revised schedule is honest about the time already gone: every
      // window (kept + fresh) re-baselines from the clock's current minute
      windowAnchorMin: clockMin,
    });
    setDone(keptDone);
    setMissionIds([...keptIds, ...fresh.map(() => undefined)]);
    scrubbedSeenRef.current = new Set();
    toast({
      title: "REPLAN FILED",
      description: fresh.length
        ? `${fresh.length} fresh mission${fresh.length > 1 ? "s" : ""} filed into the window you have left. The board is watching.`
        : "Nothing fits the time that's left — hold the line with the missions you kept.",
    });
  }

  async function playAnnouncement() {
    if (!plan) return;
    setAnnouncing(true);
    const text =
      planMode === "road"
        ? `Attention please. The ${plan.airport.city} to ${plan.destination?.city ?? "parts unknown"} ${plan.vehicle === "train" ? "express" : "service"} is now boarding at platform infinity. ${plan.missions.length} journey stages, ${fmtDuration(plan.totalDurationMin)} on the road. Chai is not optional. Wheels control, out.`
        : `Attention travellers. The ${plan.airport.city} ${passMeta.announceKind} is now boarding at the gate. ${plan.missions.length} missions, ${fmtDuration(plan.totalDurationMin)} window. Keep your sense of wonder handy. Gate control, out.`;
    // DEAF-AWARE: the caption feed shows every announcement as it's spoken
    if (plan.accessProfile === "deaf") setAnnCaption(text);
    try {
      const res = await fetch("/api/ai/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("tower silent");
      const blob = await res.blob();
      if (audioRef.current) URL.revokeObjectURL(audioRef.current.src);
      const url = URL.createObjectURL(blob);
      audioRef.current = new Audio(url);
      audioRef.current.play();
    } catch {
      toast({
        title: planMode === "road" ? "The conductor is not answering" : "Tower is not answering",
        description: "The announcement will have to be imagined.",
      });
    } finally {
      setAnnouncing(false);
    }
  }

  async function makePostcard() {
    if (!plan) return;
    setPostcardLoading(true);
    setPostcardUrl(null);
    setPostcardFallback(false);
    try {
      // Postcards are sent from where you're headed: in WHEELS the stop is the
      // origin, so illustrate the destination town instead. The stop code is
      // what anchors the scene — the press never borrows another city.
      const postcardCity =
        planMode === "road" ? (plan.destination?.city ?? plan.airport.city) : plan.airport.city;
      const postcardIata =
        planMode === "road" ? (plan.destination?.code ?? "") : plan.airport.iata;
      const res = await fetch("/api/ai/postcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: postcardCity,
          country: plan.airport.country ?? "",
          vibe: plan.vibe,
          iata: postcardIata,
          mode: planMode,
          vehicle: plan.vehicle,
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.id) {
        setPostcardFallback(true);
        return;
      }
      // Poll the press with short requests — no proxy can sever those.
      // Cached + showcase presses finish instantly (their POST already says
      // status:"done"), so skip the initial wait for those.
      const instant = data.status === "done";
      const deadline = Date.now() + 150_000;
      let polls = 0;
      let pollErrors = 0;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, polls === 0 ? (instant ? 0 : 1_500) : 2_500));
        polls++;
        try {
          const pr = await fetch(`/api/ai/postcard?id=${encodeURIComponent(data.id)}`);
          if (!pr.ok) throw new Error(`poll ${pr.status}`);
          const pj = await pr.json();
          if (pj.status === "done" && pj.imageDataUrl) {
            setPostcardUrl(pj.imageDataUrl);
            return;
          }
          if (pj.status === "jammed") {
            setPostcardFallback(true);
            return;
          }
        } catch {
          pollErrors++;
          if (pollErrors >= 4) {
            setPostcardFallback(true);
            return;
          }
        }
      }
      setPostcardFallback(true); // press overran its deadline
    } catch {
      setPostcardFallback(true);
    } finally {
      setPostcardLoading(false);
    }
  }

  function reset() {
    setStep("idle");
    setPlan(null);
    setDone({});
    setMissionIds([]);
    setPostcardUrl(null);
    setPostcardFallback(false);
    setAnnCaption(null);
    setClockMin(0);
    scrubbedSeenRef.current = new Set();
  }

  const VehicleIcon = vehicle === "train" ? TrainFront : Bus;

  // EVERY BODY BOARDS — DPNA files a quieter terminal: the kinetic layer
  // stops the moment the code is chosen (and for the whole trip after).
  const lowStim = accessProfile === "dpna" || plan?.accessProfile === "dpna";

  return (
    <div
      className={`theme-fade flex min-h-screen flex-col ${sweep ? "mode-morphing" : ""} ${lowStim ? "low-stim" : ""}`}
      data-mode={mode}
    >
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6">
          <a href="#top" className="flex shrink-0 items-center gap-2.5">
            <span className="glow-amber flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              {mode === "road" ? (
                <Bus className="size-5" aria-hidden="true" />
              ) : (
                <Plane className="size-5 rotate-45" aria-hidden="true" />
              )}
            </span>
            <span>
              <span className="block font-mono text-sm font-bold tracking-[0.3em] text-primary board-glow">
                LAYOVER
              </span>
              <span className="hidden sm:block font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
                {mode === "road" ? "DEAD MILES → ADVENTURES" : "DEAD HOURS → ADVENTURES"}
              </span>
            </span>
          </a>
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
            <WifiOff
              className={`hidden size-4 sm:block ${demoMode ? "text-primary" : "text-muted-foreground/40"}`}
              aria-hidden="true"
            />
            <label className="hidden sm:flex cursor-pointer items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
              DEMO MODE
              <Switch checked={demoMode} onCheckedChange={setDemoMode} aria-label="Toggle demo mode" />
            </label>
            <ThemeToggle />
            <CrewChip crew={crew} onLogin={handleCrewLogin} onLogout={handleCrewLogout} refreshKey={boardTick} />
            <Button
              size="sm"
              onClick={() => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" })}
              className="px-3 font-mono text-xs tracking-widest sm:px-4"
            >
              PLAN MINE
            </Button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* ── HERO ── */}
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16">
          <div className="text-center">
            <p className="font-mono text-[10px] tracking-[0.4em] text-muted-foreground">
              {mode === "road"
                ? "LAYOVER · ROADS NEVER SLEEP · MILE ∞ · BAY 7"
                : "LAYOVER · THE TERMINAL NEVER SLEEPS · GATE ∞ · BAY 7"}
            </p>
            <div className="mt-8 flex justify-center">
              <ModeSwitch mode={mode} onChange={switchMode} />
            </div>
            <p className="mt-3 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
              {meta.subline}
            </p>
            <div
              className={`mt-6 flex justify-center overflow-hidden ${
                mode === "road" ? "sign-panel rounded-2xl px-4 py-3 sm:px-6 sm:py-4" : ""
              }`}
            >
              <SplitFlapText
                key={mode}
                text={meta.heroText}
                staggerMs={40}
                cellClassName="w-[0.82em] h-[1.35em] text-[5.6vw] sm:text-6xl lg:text-7xl font-mono font-bold"
                className="gap-[4px]"
              />
            </div>
            <p className="mx-auto mt-6 max-w-xl text-balance text-muted-foreground">
              {mode === "air"
                ? "Type your airport. Set your layover. Gate Control AI turns dead hours into a "
                : "Pick your route. Bus or train. Route Control AI turns the whole ride into a "}
              <span className="text-primary font-semibold">mission-based micro-adventure</span> — timed,
              stamped, and kept forever.
            </p>
          </div>

          <div className="mt-10">
            {mode === "air" ? (
              <DepartureBoard
                rows={missionRows.length > 0 ? [...missionRows, ...BOARD_ROWS] : BOARD_ROWS}
                firstColLabel={meta.firstColLabel}
              />
            ) : (
              <LedAdvisory />
            )}
          </div>

          {/* ticker */}
          <div
            key={mode}
            className="mt-6 overflow-hidden rounded-md border border-border/60 bg-card/50 py-2"
            aria-hidden="true"
          >
            <div className="ticker flex w-max whitespace-nowrap font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
              <span className="px-2">{tickerText.repeat(3)}</span>
              <span className="px-2">{tickerText.repeat(3)}</span>
            </div>
          </div>
        </section>

        {/* ── PLANNER ── */}
        <section
          id="plan"
          className={`mx-auto mt-16 scroll-mt-20 px-4 sm:px-6 ${
            step === "ready" && planMode === "road" ? "max-w-5xl" : "max-w-3xl"
          }`}
        >
          <div
            className={`rounded-xl border p-5 shadow-xl backdrop-blur sm:p-8 ${
              mode === "road" ? "sign-panel border-0 bg-transparent" : "border-border bg-card/60"
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2
                className={`font-mono text-xs tracking-[0.35em] ${
                  mode === "road" ? "text-[#f4efe4] board-glow-road" : "text-primary board-glow"
                }`}
              >
                {meta.plannerHeading}
              </h2>
              <span
                className={`font-mono text-[9px] tracking-widest ${
                  mode === "road" ? "text-[#f4efe4]/70" : "text-muted-foreground"
                }`}
              >
                {demoMode ? "DEMO LOCK ENGAGED" : meta.controlLabel}
              </span>
            </div>

            {step === "generating" ? (
              <GenerationStatus
                airportLabel={
                  mode === "road"
                    ? `${origin ? `${origin.iata} · ${origin.city}` : "…"} → ${destination?.city ?? "…"}`
                    : airport
                      ? `${airport.iata} · ${airport.city}`
                      : "…"
                }
                lines={meta.statusLines}
              />
            ) : step === "ready" && plan ? (
              <div className="space-y-6">
                {/* USP-A — the demo clock: the board defends your time */}
                {demoMode && (
                  <div
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2"
                    role="timer"
                    aria-label={`Demo clock: journey minute ${fmtJourneyClock(clockMin)} of ${fmtJourneyClock(plan.totalDurationMin)}`}
                  >
                    <Timer className="size-4 text-primary" aria-hidden="true" />
                    <span className="board-glow font-mono text-[11px] font-bold tracking-widest text-primary">
                      T+{fmtJourneyClock(clockMin)}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                      / {fmtJourneyClock(plan.totalDurationMin)} LAYOVER · SIM 1S = {SIM_RATE}M · WINDOWS ENFORCED
                    </span>
                    {clockMin >= plan.totalDurationMin && (
                      <span className="font-mono text-[10px] font-bold tracking-widest text-primary">
                        LAYOVER OVER — DEAD HOURS DEFENDED
                      </span>
                    )}
                  </div>
                )}
                {/* quick summary + actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p
                    className={`font-mono text-xs tracking-widest ${
                      mode === "road" ? "text-[#f4efe4]/70" : "text-muted-foreground"
                    }`}
                  >
                    {planMode === "road" ? "TICKET ISSUED FOR" : "PASS ISSUED FOR"}{" "}
                    <span
                      className={`font-bold ${mode === "road" ? "text-[#f4efe4]" : "text-primary"}`}
                    >
                      {planMode === "road"
                        ? `${plan.airport.city.toUpperCase()} → ${(plan.destination?.city ?? "& BACK").toUpperCase()}`
                        : plan.airport.iata}
                    </span>{" "}
                    · {plan.missions.length} {planMode === "road" ? "STAGES" : "MISSIONS"} ·{" "}
                    {fmtDuration(plan.totalDurationMin)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={playAnnouncement}
                      disabled={announcing}
                      className="font-mono text-xs tracking-widest"
                    >
                      {announcing ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
                      ANNOUNCE
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={makePostcard}
                      disabled={postcardLoading}
                      className="font-mono text-xs tracking-widest"
                    >
                      {postcardLoading ? <Loader2 className="size-4 animate-spin" /> : <MailOpen className="size-4" />}
                      POSTCARD
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={reset}
                      className="font-mono text-xs tracking-widest"
                    >
                      <RotateCcw className="size-4" />
                      NEW
                    </Button>
                    {scrubCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={replan}
                        className="border-[#c2452d]/50 font-mono text-xs tracking-widest text-[#c2452d] hover:bg-[#c2452d]/10 hover:text-[#c2452d]"
                      >
                        <RefreshCw className="size-4" />
                        REPLAN · {scrubCount} SCRUBBED
                      </Button>
                    )}
                  </div>
                </div>

                {planMode === "road" ? (
                  <BusTicketCard plan={plan} done={done} onToggleMission={toggleMission} source={source} scrubbed={scrubbedMap} />
                ) : (
                  <BoardingPassCard
                    plan={plan}
                    done={done}
                    onToggleMission={toggleMission}
                    source={source}
                    passTitle={passMeta.passTitle}
                    passSubtitle={passMeta.passSubtitle}
                    routeFrom={passMeta.routeFrom}
                    scrubbed={scrubbedMap}
                  />
                )}

                {/* DEAF-AWARE — every announcement gets a visual twin */}
                {plan.accessProfile === "deaf" && (
                  <LedCaptionStrip caption={annCaption} live={announcing} />
                )}

                {/* postcard area */}
                {(postcardUrl || postcardFallback || postcardLoading) && (
                  <div className="pass-enter mx-auto max-w-md">
                    <div className="rotate-[-1.2deg] rounded-lg bg-paper p-3 pb-5 shadow-2xl">
                      <div className="relative flex aspect-[1344/768] items-center justify-center overflow-hidden rounded-md bg-[#e8e0cd]">
                        {postcardUrl ? (
                          <img
                            src={postcardUrl}
                            alt={`AI-generated postcard of ${
                              planMode === "road"
                                ? (plan.destination?.city ?? plan.airport.city)
                                : plan.airport.city
                            }`}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="p-6 text-center">
                            <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#6f6a5c]">
                              {postcardLoading ? "THE PRESS IS INKING…" : "PRESS JAMMED — POSTCARD PENDING"}
                            </p>
                            <p className="mt-2 text-xs italic text-[#6f6a5c]/80">
                              {postcardLoading
                                ? planMode === "road"
                                  ? "ghat roads, chai steam, one faithful bus"
                                  : "vintage ink, amber skies, one tiny airplane"
                                : "imagine something beautiful with us"}
                            </p>
                            {postcardLoading ? (
                              <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-[#6f6a5c]/60">
                                INK DRIES IN ~1 MIN — HANG TIGHT
                              </p>
                            ) : (
                              <p className="mt-3 text-center">
                                <button
                                  onClick={makePostcard}
                                  className="inline-flex min-h-11 items-center gap-1.5 rounded border border-[#6f6a5c]/40 px-3 font-mono text-[10px] tracking-[0.2em] text-[#6f6a5c] transition-colors hover:border-[#6f6a5c] hover:text-[#17150f] sm:min-h-0 sm:py-1"
                                >
                                  <MailOpen className="size-3" aria-hidden="true" />
                                  RUN THE PRESS AGAIN
                                </button>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-center font-mono text-[10px] tracking-[0.25em] text-[#6f6a5c]">
                        {planMode === "road"
                          ? `GREETINGS FROM THE ${plan.routeCode ?? "OPEN ROAD"} — WISH YOU WERE ON BOARD`
                          : `GREETINGS FROM ${plan.airport.city.toUpperCase()} — WISH YOU WERE HERE`}
                      </p>
                      {postcardUrl && !postcardLoading && (
                        <p className="mt-2 text-center">
                          <a
                            href={postcardUrl}
                            download={`layover-postcard-${planMode === "road" ? (plan.destination?.city ?? plan.airport.city).toLowerCase().replace(/\s+/g, "-") : plan.airport.iata.toLowerCase()}.png`}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded border border-[#6f6a5c]/40 px-3 font-mono text-[10px] tracking-[0.2em] text-[#6f6a5c] transition-colors hover:border-[#6f6a5c] hover:text-[#17150f] sm:min-h-0 sm:py-1"
                            aria-label="Save the postcard image"
                          >
                            <Download className="size-3" aria-hidden="true" />
                            SAVE POSTCARD
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-7">
                {mode === "air" ? (
                  <div>
                    <span className="mb-2 block font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
                      {meta.stopLabel}
                    </span>
                    <AirportCombobox
                      id="airport-input"
                      value={airport}
                      onSelect={setAirport}
                      mode="air"
                      icon="plane"
                      placeholder={meta.stopPlaceholder}
                    />
                    <p className="mt-2 font-mono text-[10px] text-muted-foreground/70">{meta.tryHint}</p>
                  </div>
                ) : (
                  <>
                    {/* vehicle toggle — bus or train */}
                    <div>
                      <span className="mb-2 block font-mono text-[10px] tracking-[0.25em] text-[#f4efe4]/80">
                        PICK YOUR WHEELS
                      </span>
                      <div
                        role="radiogroup"
                        aria-label="Vehicle type"
                        className="grid grid-cols-2 gap-2"
                      >
                        {(
                          [
                            { id: "bus", label: "BUS · ROADS", Icon: Bus },
                            { id: "train", label: "TRAIN · RAILS", Icon: TrainFront },
                          ] as const
                        ).map(({ id, label, Icon }) => {
                          const selected = vehicle === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => setVehicle(id)}
                              className={`flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 font-mono text-xs font-bold tracking-widest transition-all ${
                                selected
                                  ? "bg-[#f4efe4] text-[#0c6d38] border-[#f4efe4]"
                                  : "border-[#f4efe4]/40 text-[#f4efe4]/85 hover:bg-[#f4efe4]/10"
                              }`}
                            >
                              <Icon className="size-4" aria-hidden="true" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* FROM / TO journey inputs */}
                    <div className="grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
                      <div>
                        <span className="mb-2 block font-mono text-[10px] tracking-[0.25em] text-[#f4efe4]/80">
                          FROM · BOARDING
                        </span>
                        <AirportCombobox
                          id="origin-input"
                          value={origin}
                          onSelect={setOrigin}
                          mode="road"
                          icon={vehicle}
                          vehicle={vehicle}
                          placeholder="Bus stand, station, halt…"
                        />
                      </div>
                      <div className="flex h-14 items-center justify-center sm:pt-6">
                        <ArrowRight className="size-5 rotate-90 text-[#f4efe4] sm:rotate-0" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="mb-2 block font-mono text-[10px] tracking-[0.25em] text-[#f4efe4]/80">
                          TO · ARRIVAL
                        </span>
                        <AirportCombobox
                          id="destination-input"
                          value={destination}
                          onSelect={setDestination}
                          mode="road"
                          icon={vehicle}
                          vehicle={vehicle}
                          excludeIata={origin?.iata}
                          placeholder="Where the road ends…"
                        />
                      </div>
                    </div>
                    <p className="-mt-4 font-mono text-[10px] text-[#f4efe4]/60">{meta.tryHint}</p>
                  </>
                )}

                <DurationSlider value={duration} onChange={setDuration} label={meta.durationLabel} />
                <VibePicker value={vibe} onChange={setVibe} mode={mode} />
                <AccessPicker value={accessProfile} onChange={setAccessProfile} />

                <Button
                  size="lg"
                  onClick={generate}
                  className="glow-strong w-full min-h-14 font-mono text-sm font-bold tracking-[0.25em]"
                >
                  {mode === "road" ? <VehicleIcon className="size-5" /> : <ShieldCheck className="size-5" />}
                  {meta.buttonLabel}
                </Button>
                <p
                  className={`text-center font-mono text-[10px] tracking-[0.2em] ${
                    mode === "road" ? "text-[#f4efe4]/60" : "text-muted-foreground/70"
                  }`}
                >
                  {mode === "air"
                    ? "GATE CONTROL RESPONDS IN ~10–20 SECONDS · DEMO MODE = INSTANT"
                    : "ROUTE CONTROL RESPONDS IN ~10–20 SECONDS · DEMO MODE = INSTANT"}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── WALL OF ADVENTURES ── */}
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="font-mono text-xs tracking-[0.35em] text-primary board-glow">
                {mode === "road" ? "MILESTONE WALL" : "WALL OF ADVENTURES"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "road"
                  ? "Every journey flagged off tonight, logged mile by mile."
                  : "Every journey filed tonight, archived forever."}
              </p>
            </div>
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
              {wall.length} LOGGED
            </span>
          </div>

          {wall.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="font-mono text-xs tracking-[0.25em] text-muted-foreground">{meta.emptyWallLine}</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Recent adventures">
              {wall.map((t) => (
                <li
                  key={t.id}
                  className="group rounded-lg border border-border bg-card/60 p-4 transition-all hover:border-primary/40 hover:bg-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-primary">
                      {t.mode === "road" ? (
                        t.vehicle === "train" ? (
                          <TrainFront className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Bus className="size-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <Plane className="size-3.5" aria-hidden="true" />
                      )}
                      {t.iata}
                      <span className="font-mono text-[9px] font-normal tracking-widest text-muted-foreground">
                        {t.mode === "road" ? (t.vehicle === "train" ? "WHEELS·TRAIN" : "WHEELS·BUS") : "WINGS"}
                      </span>
                      {t.accessProfile && t.accessProfile !== "none" && (
                        <span
                          className="rounded border border-[#2d7d74]/50 px-1 py-0.5 font-mono text-[8px] font-bold tracking-widest text-[#2d7d74]"
                          title="Traveled with an IATA assistance code — every mission planned around it"
                        >
                          SSR {t.accessProfile.toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[9px] tracking-widest text-muted-foreground">
                      {t.source === "demo" || t.source === "showcase" ? "TRAINING" : "LIVE"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold leading-snug">{t.adventureTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.mode === "road" && t.destination ? `${t.city} → ${t.destination}` : t.city}
                    {t.nickname ? (
                      <span className="ml-1.5 font-mono text-[9px] tracking-widest text-muted-foreground/80">
                        · CREW {t.nickname.toUpperCase()}
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground">
                    <span>
                      {t.missionsDone}/{t.missionsTotal} {t.mode === "road" ? "STAGES" : "MISSIONS"}
                    </span>
                    <span className="flex gap-1">
                      {Array.from({ length: t.missionsTotal }).map((_, i) => (
                        <span
                          key={i}
                          className={`size-2 rounded-full ${i < t.missionsDone ? "bg-primary" : "bg-muted-foreground/40"}`}
                        />
                      ))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── CREW LEADERBOARD — crew ranked per stop and overall ── */}
        <section className="mx-auto mt-14 max-w-6xl px-4 pb-20 sm:px-6" aria-label="Crew leaderboard">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="board-glow font-mono text-xs tracking-[0.35em] text-primary">
                CREW LEADERBOARD
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Crew ranked by badges — overall, and at every gate they've played.
              </p>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground">
              <Award className="size-3.5" aria-hidden="true" />
              1 BADGE = 1 STAMPED MISSION
            </span>
          </div>
          <Leaderboard refreshKey={boardTick} crewNickname={crew?.nickname ?? null} />
        </section>
      </main>

      {/* ── STICKY FOOTER ── */}
      <footer className="relative mt-auto border-t border-border/60 bg-card/40">
        <div className="safe-bottom mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
            LAYOVER v3 · WINGS ⇄ WHEELS · {meta.footerLine}
          </p>
          <div className="flex items-center gap-3">
            <CostGuardChip />
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
              TRAVELER {nickname}
            </span>
            <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground sm:hidden">
              DEMO
              <Switch checked={demoMode} onCheckedChange={setDemoMode} aria-label="Toggle demo mode" />
            </label>
          </div>
        </div>
      </footer>

      {/* ── WORLD-SWAP — a wheel rolls you INTO wheels, a plane flies you back to wings ── */}
      {sweep && <WorldTransition kind={sweep} />}
    </div>
  );
}
