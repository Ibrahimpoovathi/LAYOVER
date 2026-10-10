/**
 * LAYOVER — bundled airport dataset (offline-first).
 * Kept intentionally lean: major international hubs + strong Indian coverage
 * (the demo floor is in Calicut — CCJ must resolve instantly, even offline).
 */

export type StopMode = "air" | "road";
export type StopKind = "airport" | "bus" | "train" | "halt";

export interface Airport {
  iata: string;
  icao?: string;
  city: string;
  name: string;
  country: string;
  region: "india" | "asia" | "gulf" | "europe" | "americas" | "oceania" | "africa";
  /** entries without this default to "air" (airports). "road" = wheels world */
  mode?: StopMode;
  /** wheels flavor: bus stand / railway station / highway halt (drives icons + AI prompt) */
  kind?: StopKind;
}

export const AIRPORTS: Airport[] = [
  // ---------- India ----------
  { iata: "CCJ", city: "Kozhikode", name: "Calicut International", country: "India", region: "india" },
  { iata: "COK", city: "Kochi", name: "Cochin International", country: "India", region: "india" },
  { iata: "TRV", city: "Thiruvananthapuram", name: "Trivandrum International", country: "India", region: "india" },
  { iata: "DEL", city: "New Delhi", name: "Indira Gandhi International", country: "India", region: "india" },
  { iata: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International", country: "India", region: "india" },
  { iata: "BLR", city: "Bengaluru", name: "Kempegowda International", country: "India", region: "india" },
  { iata: "MAA", city: "Chennai", name: "Chennai International", country: "India", region: "india" },
  { iata: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International", country: "India", region: "india" },
  { iata: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose International", country: "India", region: "india" },
  { iata: "GOI", city: "Goa", name: "Goa International (Dabolim)", country: "India", region: "india" },
  { iata: "IXC", city: "Chandigarh", name: "Shaheed Bhagat Singh International", country: "India", region: "india" },
  { iata: "PNQ", city: "Pune", name: "Pune International", country: "India", region: "india" },
  { iata: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel International", country: "India", region: "india" },
  { iata: "JAI", city: "Jaipur", name: "Jaipur International", country: "India", region: "india" },
  { iata: "LKO", city: "Lucknow", name: "Chaudhary Charan Singh International", country: "India", region: "india" },
  { iata: "IXB", city: "Bagdogra", name: "Bagdogra International", country: "India", region: "india" },
  { iata: "IXL", city: "Leh", name: "Kushok Bakula Rimpochee", country: "India", region: "india" },
  { iata: "IXZ", city: "Port Blair", name: "Veer Savarkar International", country: "India", region: "india" },

  // ---------- Gulf (favorite layover corridors from Kerala) ----------
  { iata: "DXB", city: "Dubai", name: "Dubai International", country: "UAE", region: "gulf" },
  { iata: "AUH", city: "Abu Dhabi", name: "Zayed International", country: "UAE", region: "gulf" },
  { iata: "DOH", city: "Doha", name: "Hamad International", country: "Qatar", region: "gulf" },
  { iata: "RUH", city: "Riyadh", name: "King Khalid International", country: "Saudi Arabia", region: "gulf" },
  { iata: "JED", city: "Jeddah", name: "King Abdulaziz International", country: "Saudi Arabia", region: "gulf" },
  { iata: "MCT", city: "Muscat", name: "Muscat International", country: "Oman", region: "gulf" },
  { iata: "BAH", city: "Manama", name: "Bahrain International", country: "Bahrain", region: "gulf" },
  { iata: "KWI", city: "Kuwait City", name: "Kuwait International", country: "Kuwait", region: "gulf" },

  // ---------- Asia ----------
  { iata: "SIN", city: "Singapore", name: "Changi", country: "Singapore", region: "asia" },
  { iata: "KUL", city: "Kuala Lumpur", name: "Kuala Lumpur International", country: "Malaysia", region: "asia" },
  { iata: "BKK", city: "Bangkok", name: "Suvarnabhumi", country: "Thailand", region: "asia" },
  { iata: "DMK", city: "Bangkok", name: "Don Mueang International", country: "Thailand", region: "asia" },
  { iata: "HKG", city: "Hong Kong", name: "Hong Kong International", country: "Hong Kong", region: "asia" },
  { iata: "NRT", city: "Tokyo", name: "Narita International", country: "Japan", region: "asia" },
  { iata: "HND", city: "Tokyo", name: "Haneda", country: "Japan", region: "asia" },
  { iata: "ICN", city: "Seoul", name: "Incheon International", country: "South Korea", region: "asia" },
  { iata: "PVG", city: "Shanghai", name: "Shanghai Pudong International", country: "China", region: "asia" },
  { iata: "PEK", city: "Beijing", name: "Beijing Capital International", country: "China", region: "asia" },
  { iata: "TPE", city: "Taipei", name: "Taoyuan International", country: "Taiwan", region: "asia" },
  { iata: "MNL", city: "Manila", name: "Ninoy Aquino International", country: "Philippines", region: "asia" },
  { iata: "CGK", city: "Jakarta", name: "Soekarno–Hatta International", country: "Indonesia", region: "asia" },
  { iata: "DPS", city: "Bali (Denpasar)", name: "Ngurah Rai International", country: "Indonesia", region: "asia" },
  { iata: "CMB", city: "Colombo", name: "Bandaranaike International", country: "Sri Lanka", region: "asia" },
  { iata: "KTM", city: "Kathmandu", name: "Tribhuvan International", country: "Nepal", region: "asia" },
  { iata: "DAC", city: "Dhaka", name: "Hazrat Shahjalal International", country: "Bangladesh", region: "asia" },
  { iata: "SGN", city: "Ho Chi Minh City", name: "Tan Son Nhat International", country: "Vietnam", region: "asia" },
  { iata: "HAN", city: "Hanoi", name: "Noi Bai International", country: "Vietnam", region: "asia" },

  // ---------- Europe ----------
  { iata: "LHR", city: "London", name: "Heathrow", country: "United Kingdom", region: "europe" },
  { iata: "LGW", city: "London", name: "Gatwick", country: "United Kingdom", region: "europe" },
  { iata: "CDG", city: "Paris", name: "Charles de Gaulle", country: "France", region: "europe" },
  { iata: "AMS", city: "Amsterdam", name: "Schiphol", country: "Netherlands", region: "europe" },
  { iata: "FRA", city: "Frankfurt", name: "Frankfurt am Main", country: "Germany", region: "europe" },
  { iata: "MUC", city: "Munich", name: "Munich International", country: "Germany", region: "europe" },
  { iata: "IST", city: "Istanbul", name: "Istanbul Airport", country: "Türkiye", region: "europe" },
  { iata: "MAD", city: "Madrid", name: "Adolfo Suárez Barajas", country: "Spain", region: "europe" },
  { iata: "BCN", city: "Barcelona", name: "El Prat", country: "Spain", region: "europe" },
  { iata: "FCO", city: "Rome", name: "Leonardo da Vinci Fiumicino", country: "Italy", region: "europe" },
  { iata: "ZRH", city: "Zürich", name: "Zurich Airport", country: "Switzerland", region: "europe" },
  { iata: "VIE", city: "Vienna", name: "Vienna International", country: "Austria", region: "europe" },
  { iata: "CPH", city: "Copenhagen", name: "Copenhagen Airport", country: "Denmark", region: "europe" },
  { iata: "DUB", city: "Dublin", name: "Dublin Airport", country: "Ireland", region: "europe" },

  // ---------- Americas ----------
  { iata: "JFK", city: "New York", name: "John F. Kennedy International", country: "United States", region: "americas" },
  { iata: "EWR", city: "Newark", name: "Newark Liberty International", country: "United States", region: "americas" },
  { iata: "SFO", city: "San Francisco", name: "San Francisco International", country: "United States", region: "americas" },
  { iata: "LAX", city: "Los Angeles", name: "Los Angeles International", country: "United States", region: "americas" },
  { iata: "ORD", city: "Chicago", name: "O'Hare International", country: "United States", region: "americas" },
  { iata: "YYZ", city: "Toronto", name: "Toronto Pearson International", country: "Canada", region: "americas" },
  { iata: "GRU", city: "São Paulo", name: "Guarulhos International", country: "Brazil", region: "americas" },
  { iata: "MEX", city: "Mexico City", name: "Benito Juárez International", country: "Mexico", region: "americas" },

  // ---------- Oceania ----------
  { iata: "SYD", city: "Sydney", name: "Kingsford Smith", country: "Australia", region: "oceania" },
  { iata: "MEL", city: "Melbourne", name: "Tullamarine", country: "Australia", region: "oceania" },
  { iata: "AKL", city: "Auckland", name: "Auckland Airport", country: "New Zealand", region: "oceania" },

  // ---------- Africa ----------
  { iata: "JNB", city: "Johannesburg", name: "O. R. Tambo International", country: "South Africa", region: "africa" },
  { iata: "CAI", city: "Cairo", name: "Cairo International", country: "Egypt", region: "africa" },
  { iata: "NBO", city: "Nairobi", name: "Jomo Kenyatta International", country: "Kenya", region: "africa" },
  { iata: "ADD", city: "Addis Ababa", name: "Bole International", country: "Ethiopia", region: "africa" },
];

/**
 * WHEELS STOPS — bus terminals, railway stations, highway halts.
 * Same shape as airports (3-letter code kept in `iata` for schema compat).
 * Kerala-heavy: the demo floor is in Calicut — wheels are THE layover of Kerala.
 */
export const ROAD_STOPS: Airport[] = [
  // ---------- bus stands ----------
  { iata: "KBS", city: "Kozhikode", name: "KSRTC Bus Stand (Mavoor Road)", country: "India", region: "india", mode: "road", kind: "bus" },
  { iata: "VYT", city: "Kochi", name: "Vyttila Mobility Hub", country: "India", region: "india", mode: "road", kind: "bus" },
  { iata: "THP", city: "Thiruvananthapuram", name: "Thampanoor Central Bus Stand", country: "India", region: "india", mode: "road", kind: "bus" },
  { iata: "QLN", city: "Kollam", name: "Kollam KSRTC Bus Stand", country: "India", region: "india", mode: "road", kind: "bus" },
  { iata: "TCR", city: "Thrissur", name: "Sakthan Thampuran Bus Stand", country: "India", region: "india", mode: "road", kind: "bus" },
  { iata: "KNR", city: "Kannur", name: "Kannur New Bus Stand", country: "India", region: "india", mode: "road", kind: "bus" },
  { iata: "ALP", city: "Alappuzha", name: "Alappuzha Bus Stand", country: "India", region: "india", mode: "road", kind: "bus" },
  { iata: "MJS", city: "Bengaluru", name: "Kempegowda Bus Stand (Majestic)", country: "India", region: "india", mode: "road", kind: "bus" },
  { iata: "CMT", city: "Chennai", name: "CMBT Koyambedu", country: "India", region: "india", mode: "road", kind: "bus" },
  { iata: "GPM", city: "Coimbatore", name: "Gandhipuram Bus Stand", country: "India", region: "india", mode: "road", kind: "bus" },
  { iata: "MYS", city: "Mysuru", name: "Bannimantap Bus Stand", country: "India", region: "india", mode: "road", kind: "bus" },
  // ---------- railway stations (WHEELS·TRAIN) ----------
  { iata: "CLT", city: "Kozhikode", name: "Kozhikode Railway Station", country: "India", region: "india", mode: "road", kind: "train" },
  { iata: "ERS", city: "Ernakulam", name: "Ernakulam Junction", country: "India", region: "india", mode: "road", kind: "train" },
  { iata: "TVC", city: "Thiruvananthapuram", name: "Thiruvananthapuram Central", country: "India", region: "india", mode: "road", kind: "train" },
  { iata: "SBC", city: "Bengaluru", name: "KSR Bengaluru City Jn", country: "India", region: "india", mode: "road", kind: "train" },
  { iata: "MAS", city: "Chennai", name: "Chennai Central", country: "India", region: "india", mode: "road", kind: "train" },
  { iata: "CSMT", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Terminus", country: "India", region: "india", mode: "road", kind: "train" },
  { iata: "HWH", city: "Kolkata", name: "Howrah Junction", country: "India", region: "india", mode: "road", kind: "train" },
  { iata: "SC", city: "Hyderabad", name: "Secunderabad Junction", country: "India", region: "india", mode: "road", kind: "train" },
  // ---------- highway halts ----------
  { iata: "RSP", city: "NH-66 Kerala", name: "Highway Rest Plaza", country: "India", region: "india", mode: "road", kind: "halt" },
  { iata: "NHT", city: "NH-48 Tamil Nadu", name: "Highway Food Mall", country: "India", region: "india", mode: "road", kind: "halt" },
  { iata: "DHB", city: "NH-44", name: "Highway Dhaba Halt", country: "India", region: "india", mode: "road", kind: "halt" },
];

/** Everything searchable, airports first then road stops. */
export const ALL_STOPS: Airport[] = [...AIRPORTS, ...ROAD_STOPS];

/** Offline fuzzy search across iata / city / country / name.
 *  opts.mode: filter air vs road world · opts.vehicle: prefer bus/train kind
 *  opts.excludeIata: drop one stop (the origin, when picking a destination). */
export function searchAirports(
  query: string,
  limit = 8,
  opts?: { mode?: "air" | "road"; vehicle?: "bus" | "train"; excludeIata?: string }
): Airport[] {
  const mode = opts?.mode;
  let pool = mode ? ALL_STOPS.filter((s) => (s.mode ?? "air") === mode) : ALL_STOPS;
  if (opts?.excludeIata) pool = pool.filter((s) => s.iata !== opts.excludeIata);

  // vehicle-aware ordering: preferred kind floats to the top of suggestions
  const kindOf = (a: Airport) => a.kind ?? "airport";
  const preferred = opts?.vehicle;
  const kindBoost = (a: Airport): number => {
    if (!preferred || mode !== "road") return 0;
    const k = kindOf(a);
    if (k === preferred) return 30; // exact vehicle first
    if (k === "halt") return 12; // halts serve both
    return 0;
  };

  const q = query.trim().toLowerCase();
  if (!q) return [...pool].sort((a, b) => kindBoost(b) - kindBoost(a)).slice(0, limit);
  const scored = pool.map((a) => {
    const iata = a.iata.toLowerCase();
    const city = a.city.toLowerCase();
    const country = a.country.toLowerCase();
    const name = a.name.toLowerCase();
    let score = -1;
    if (iata === q) score = 100;
    else if (iata.startsWith(q)) score = 90;
    else if (city.startsWith(q)) score = 80;
    else if (country.startsWith(q)) score = 60;
    else if (city.includes(q)) score = 55;
    else if (name.includes(q)) score = 40;
    else if (country.includes(q)) score = 35;
    // gentle India boost — the demo floor is in Calicut
    if (a.region === "india" && score > 0) score += 6;
    score += kindBoost(a);
    return { a, score };
  })
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
  return scored.map((s) => s.a);
}

export function findAirport(iata: string): Airport | undefined {
  return ALL_STOPS.find((a) => a.iata === iata.toUpperCase());
}
