import { GATE_CONTROL_LINES } from "./demo-mode";

/**
 * TRANSPORT MODES — the WINGS ⇄ WHEELS engine.
 * One registry, one switch, the whole terminal re-skins.
 * Internal ids "air"/"road" NEVER change (DB + API compat) —
 * only user-facing labels/copy live here: WINGS = air, WHEELS = bus + train.
 * The mission engine underneath stays identical — only the world changes.
 */

export type TransportMode = "air" | "road";

export interface ModeMeta {
  id: TransportMode;
  label: string; // switch label: WINGS / WHEELS
  icon: "plane" | "wheels"; // lucide icon hint (wheels = bus + train pair)
  heroText: string; // split-flap headline (chars must exist on a flap board)
  subline: string; // small line under the mode switch
  boardHeading: string; // board context
  firstColLabel: string; // board table column 1 (FLIGHT / ROUTE)
  plannerHeading: string; // planner card heading
  controlLabel: string; // "GATE CONTROL: ONLINE" / "ROUTE CONTROL: ONLINE"
  buttonLabel: string; // generate button text
  passTitle: string; // wings paper artifact title (wheels renders a ticket instead)
  passSubtitle: string;
  routeFrom: string; // route joke origin (BED → DXB / SOFA → NH-766)
  stopLabel: string; // planner form label (air only; road uses FROM/TO)
  stopPlaceholder: string;
  tryHint: string;
  durationLabel: string; // slider label
  statusLines: string[]; // theatrical generation lines
  announceKind: string; // used in TTS sentence (air)
  emptyWallLine: string;
  footerLine: string; // right-side footer flavor
}

export const ROAD_CONTROL_LINES = [
  "HAILING ROUTE CONTROL…",
  "NEGOTIATING WITH THE CONDUCTOR…",
  "PLOTTING THE DHABA STOPS…",
  "COUNTING THE HAIRPINS…",
  "INKING YOUR BUS TICKET…",
  "SHARPENING THE PUNCH PLIER…",
];

export const MODE_META: Record<TransportMode, ModeMeta> = {
  air: {
    id: "air",
    label: "WINGS",
    icon: "plane",
    heroText: "WHERE TO NEXT?",
    subline: "FLIGHT LAYOVERS · NIGHT TERMINAL · AMBER DIVISION",
    boardHeading: "DEPARTURES",
    firstColLabel: "FLIGHT",
    plannerHeading: "FILE YOUR FLIGHT PLAN",
    controlLabel: "GATE CONTROL: ONLINE",
    buttonLabel: "REQUEST ADVENTURE",
    passTitle: "BOARDING PASS",
    passSubtitle: "LAYOVER TERMINAL · DEAD HOURS DIVISION",
    routeFrom: "BED",
    stopLabel: "LAYOVER AIRPORT",
    stopPlaceholder: "Departure or layover airport",
    tryHint: "TRY: DXB · SIN · CCJ · AMS — WORKS OFFLINE",
    durationLabel: "LAYOVER WINDOW",
    statusLines: GATE_CONTROL_LINES,
    announceKind: "layover adventure",
    emptyWallLine: "THE WALL IS EMPTY — BE THE FIRST TO FILE A FLIGHT PLAN",
    footerLine: "WINGS DIVISION · AIRWAY ∞ · TOWER ON DUTY",
  },
  road: {
    id: "road",
    label: "WHEELS",
    icon: "wheels",
    heroText: "WHICH ROAD NEXT?",
    subline: "BUS & TRAIN JOURNEYS · HIGHWAY DIVISION · HORN OK PLEASE",
    boardHeading: "HIGHWAY ADVISORY",
    firstColLabel: "ROUTE",
    plannerHeading: "PLOT YOUR ROUTE",
    controlLabel: "ROUTE CONTROL: ONLINE",
    buttonLabel: "FLAG OFF THE JOURNEY",
    passTitle: "BUS TICKET",
    passSubtitle: "OLD-SCHOOL JOURNEY TICKET · PUNCH TO PLAY",
    routeFrom: "SOFA",
    stopLabel: "BOARDING POINT",
    stopPlaceholder: "Bus stand, railway station, or highway halt",
    tryHint: "TRY: KBS · MJS · CLT · TVC — WORKS OFFLINE",
    durationLabel: "TIME ON THE ROAD",
    statusLines: ROAD_CONTROL_LINES,
    announceKind: "journey service",
    emptyWallLine: "NO MILESTONES YET — FLAG OFF THE FIRST JOURNEY",
    footerLine: "WHEELS DIVISION · NH-∞ · CONDUCTOR ON DUTY",
  },
};

/** Registry order for the mode switch UI. */
export const MODE_LIST: ModeMeta[] = [MODE_META.air, MODE_META.road];

/** Adding RAIL or WATER later: add a ModeMeta entry + extend TransportMode. */
