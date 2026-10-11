/**
 * THE POSTCARD SCENE REGISTRY — "no wrong city on the wall".
 *
 * The image model paints what the prompt says. A generic prompt like
 * "airport terminal" produces a generic anywhere-postcard — or worse, a
 * recognizable landmark from some OTHER city (a Cochin postcard filed
 * under Calicut is a blunder a judge catches instantly).
 *
 * Fix: every stop in our bundled dataset carries its own vivid scene
 * descriptor. The press prompts THAT scene. Unknown stops (never happens
 * through the UI — the combobox is closed) fall back to a city-anchored
 * generic scene that names the city twice and names NO landmark at all —
 * generic is safe; the wrong landmark is not.
 */

export interface SceneContext {
  iata?: string;
  city: string;
  country?: string;
  mode: "air" | "road";
  vehicle: "bus" | "train";
}

/** Per-stop scenes — keyed by IATA (airports + road stops). */
export const STOP_SCENES: Record<string, string> = {
  // ── India · WINGS ────────────────────────────────────────────────────────
  CCJ: "Calicut Beach at dusk with its stone pier and the banded Kozhikode lighthouse, Malabar palm coast, a wooden Beypore uru dhow silhouetted on the horizon",
  COK: "Fort Kochi waterfront with its giant cantilevered Chinese fishing nets and colonial-era warehouses",
  TRV: "Thiruvananthapuram's Padmanabhaswamy temple gopuram and palm-lined Kerala coast",
  DEL: "India Gate's sandstone arch amid New Delhi's imperial boulevards",
  BOM: "the Gateway of India arch and Mumbai's harbour skyline",
  BLR: "Bengaluru's Vidhana Soudha neo-Dravidian dome among flowering gulmohar avenues",
  MAA: "Chennai's Marina Beach shoreline with the lighthouse and San Thome basilica spire",
  HYD: "the Charminar's four minarets over Hyderabad's old-city bazaar",
  CCU: "Howrah Bridge spanning the Hooghly river above Kolkata's ghats",
  GOI: "Goa's palm-fringed beach with a white Portuguese chapel and moored fishing boats",
  IXC: "Chandigarh's Sukhna Lake and the modernist Open Hand monument",
  PNQ: "Pune's Shaniwar Wada palace gate and Deccan rooftops",
  AMD: "Ahmedabad's Sabarmati riverfront with the old city's carved wooden facades",
  JAI: "the pink honeycomb facade of Jaipur's Hawa Mahal",
  LKO: "Lucknow's Bara Imambara and its great Rumi Darwaza gateway",
  IXB: "Bagdogra's tea gardens rolling toward misty Himalayan foothills",
  IXL: "Leh's whitewashed gompa above mud-brick rooftops under snow peaks",
  IXZ: "Port Blair's palm harbour and the Cellular Jail's radial wings",

  // ── Gulf · WINGS (favorite Kerala corridors) ─────────────────────────────
  DXB: "the Burj Khalifa towering over Dubai Creek with an abra water taxi, gulf sunset",
  AUH: "Abu Dhabi's Sheikh Zayed Grand Mosque domes and the corniche skyline",
  DOH: "Doha's corniche skyline and the Museum of Islamic Art on the water",
  RUH: "Riyadh's Kingdom Centre tower over the desert city",
  JED: "Jeddah's Al-Balad coral-stone houses with rawshan balconies, Red Sea corniche",
  MCT: "Muscat's Sultan Qaboos Grand Mosque and rocky Hajar coastline",
  BAH: "the twin-sail Bahrain World Trade Center over Manama's waterfront",
  KWI: "the Kuwait Towers' tiled spheres above the gulf promenade",

  // ── Asia · WINGS ─────────────────────────────────────────────────────────
  SIN: "Marina Bay Sands and the Singapore skyline reflected in the bay at dusk",
  KUL: "the Petronas Twin Towers rising above Kuala Lumpur's park",
  BKK: "Bangkok's Wat Arun temple spires along the Chao Phraya river with longtail boats",
  DMK: "Bangkok's Wat Arun temple spires along the Chao Phraya river with longtail boats",
  HKG: "Victoria Harbour with Hong Kong's peak-side towers and a Star Ferry wake",
  NRT: "Tokyo's skyline with Mount Fuji behind and a shinkansen streak",
  HND: "Tokyo's skyline with Mount Fuji behind and a shinkansen streak",
  ICN: "Seoul's Gyeongbokgung palace gates beneath N Seoul Tower",
  PVG: "Shanghai's Bund waterfront facing the Pudong tower cluster across the river",
  PEK: "Beijing's Forbidden City golden roofs under a warm red sun",
  TPE: "Taipei 101 rising over the city at dusk",
  MNL: "Manila Bay's famous sunset behind the harbour and palm rows",
  CGK: "Jakarta's Monas tower above old Batavia's canal district",
  DPS: "Bali's emerald rice terraces and a candi bentar temple gate over the sea",
  CMB: "Colombo's Galle Face promenade and lighthouse at golden hour",
  KTM: "Kathmandu's Boudhanath stupa with prayer flags and Himalayan peaks behind",
  DAC: "Dhaka's Star Mosque and cycle-rickshaw-filled streets",
  SGN: "Ho Chi Minh City's Notre-Dame basilica and motorbike rivers",
  HAN: "Hanoi's Hoan Kiem lake with the Turtle Tower and old-quarter rooftops",

  // ── Europe · WINGS ───────────────────────────────────────────────────────
  LHR: "Big Ben and the Thames with a red double-decker bus, London dusk",
  LGW: "Big Ben and the Thames with a red double-decker bus, London dusk",
  CDG: "the Eiffel Tower and Seine bridges in Paris at golden hour",
  AMS: "Amsterdam's leaning canal houses over still water with a bicycle bridge",
  FRA: "Frankfurt's glass towers along the Main river at dusk",
  MUC: "Munich's Marienplatz tower against an alpine skyline",
  IST: "ferries crossing the Bosphorus between Istanbul's minarets",
  MAD: "Madrid's Gran Via theatre facades and the Royal Palace",
  BCN: "the Sagrada Familia's spires over Barcelona's rooftops",
  FCO: "the Colosseum among Rome's terracotta rooftops",
  ZRH: "Zürich's Grossmünster towers on the lakefront with Alps behind",
  VIE: "Vienna's St. Stephen's Cathedral over baroque rooftops",
  CPH: "Copenhagen's Nyhavn colored townhouses and harbor boats",
  DUB: "Dublin's Ha'penny Bridge over the Liffey with a dart train beyond",

  // ── Americas · WINGS ─────────────────────────────────────────────────────
  JFK: "the Manhattan skyline and Statue of Liberty across New York harbor",
  EWR: "the Manhattan skyline and Statue of Liberty across New York harbor",
  SFO: "the Golden Gate Bridge in rolling fog above San Francisco bay",
  LAX: "Los Angeles' palm rows leading to downtown towers at sunset",
  ORD: "Chicago's lakeshore skyline with an elevated train streak",
  YYZ: "Toronto's CN Tower over Lake Ontario at dusk",
  GRU: "São Paulo's avenue canyon of towers under a warm haze",
  MEX: "Mexico City's Zócalo cathedral with distant volcanoes",

  // ── Oceania · WINGS ──────────────────────────────────────────────────────
  SYD: "the Sydney Opera House sails and Harbour Bridge at golden hour",
  MEL: "Melbourne's Flinders Street Station dome with a tram crossing",
  AKL: "Auckland's Sky Tower above the harbour's yacht sails",

  // ── Africa · WINGS ───────────────────────────────────────────────────────
  JNB: "Johannesburg's Hillbrow Tower above jacaranda-lined streets",
  CAI: "the pyramids of Giza rising behind Cairo's palm horizon",
  NBO: "Nairobi's skyline with acacia trees and giraffes at the city's edge",

  // ── India · WHEELS (bus stands / stations / halts) ──────────────────────
  KBS: "Kozhikode's Mavoor Road bus stand with red KSRTC buses, Malabar rooftops and coconut palms",
  CLT: "Kozhikode railway station's platform under coconut palms, a passenger train waiting at dusk",
  VYT: "Kochi's Vyttila hub with city buses and backwater ferries gliding behind",
  THP: "Thampanoor bus stand and Thiruvananthapuram's palm-lined boulevards",
  QLN: "Kollam's Ashtamudi backwaters with houseboats and coconut groves",
  TCR: "Thrissur's Thekkinkadu maidan ringed by temple rooftops and banyan shade",
  KNR: "Kannur's lighthouse beach with theyyam-red laterite cliffs and palms",
  ALP: "Alappuzha's houseboats drifting down palm-lined backwater canals",
  MJS: "Bengaluru's Majestic bus stand buzzing with city buses beneath metro pillars",
  CMT: "Chennai's CMBT bus bays with Marina palms on the horizon",
  GPM: "Coimbatore's Gandhipuram stand with the Western Ghats blue behind",
  MYS: "Mysore Palace glowing with thousands of bulbs at dusk",
  ERS: "Ernakulam Junction's platforms with backwater ferries beyond the tracks",
  TVC: "Thiruvananthapuram Central's red-tiled platform canopy and palms",
  SBC: "KSR Bengaluru City station's arched colonial facade",
  MAS: "Chennai Central's iconic red Gothic clock tower at golden hour",
  CSMT: "Mumbai CST's Gothic dome lit warmly against the evening sky",
  HWH: "Howrah Bridge looming above the station and the Hooghly ferries",
  SC: "Secunderabad's clock tower junction and station forecourt",
  RSP: "a highway rest plaza at night on NH-66, chai-stall steam and parked trucks under sodium lamps",
  NHT: "a Tamil Nadu highway food mall at night, banana-leaf meals and idling lorries",
  DHB: "a roadside dhaba on NH-44 at night, charpais under a string of bulbs and tandoor smoke",
};

/**
 * Scene for the press. Known stop → its landmark scene.
 * Unknown stop → city-anchored generic scene that names NO landmark
 * (generic is safe; a borrowed landmark is a blunder).
 */
export function sceneForStop(ctx: SceneContext): string {
  const known = ctx.iata ? STOP_SCENES[ctx.iata.toUpperCase()] : undefined;
  if (known) return known;

  const place = ctx.city || "the arrival town";
  if (ctx.mode === "air") {
    return `${place}'s own skyline glowing behind its airport control tower at dusk, runway lights in the foreground`;
  }
  if (ctx.vehicle === "train") {
    return `the ${place} railway station platform at golden hour, a passenger train waiting under the station lights`;
  }
  return `the ${place} central bus stand at golden hour, buses queuing in and travelers boarding with their bags`;
}
