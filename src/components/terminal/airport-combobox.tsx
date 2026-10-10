"use client";

import { useRef, useState } from "react";
import { Plane, Bus, TrainFront, Search } from "lucide-react";
import { searchAirports, type Airport } from "@/lib/airports";

type ComboboxIcon = "plane" | "bus" | "train";

const ICONS: Record<ComboboxIcon, React.ComponentType<{ className?: string }>> = {
  plane: Plane,
  bus: Bus,
  train: TrainFront,
};

/**
 * Offline-first stop combobox — instant search over the bundled dataset.
 * Keyboard: ↑/↓ navigate · Enter select · Esc close. 44px touch targets.
 * WHEELS mode: vehicle floats matching kinds (bus stands / stations) to the top.
 */
export function AirportCombobox({
  value,
  onSelect,
  placeholder = "City, airport or code…",
  mode,
  icon = "plane",
  vehicle,
  excludeIata,
  id = "airport-input",
}: {
  value: Airport | null;
  onSelect: (a: Airport) => void;
  placeholder?: string;
  mode?: "air" | "road";
  icon?: ComboboxIcon;
  vehicle?: "bus" | "train";
  excludeIata?: string;
  id?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const Icon = ICONS[icon];
  const results = query.trim()
    ? searchAirports(query, 8, { mode, vehicle, excludeIata })
    : searchAirports("", 6, { mode, vehicle, excludeIata });

  function choose(a: Airport) {
    onSelect(a);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <div className="flex items-center gap-3 rounded-lg border border-input bg-background/60 px-4 min-h-14 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring/40 transition-all">
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <input
          id={id}
          autoComplete="off"
          className="w-full bg-transparent py-3.5 text-base outline-none placeholder:text-muted-foreground/70"
          placeholder={value ? `${value.iata} · ${value.city}` : placeholder}
          value={query}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setOpen(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 140);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && open && results[active]) {
              e.preventDefault();
              choose(results[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {value && !query && (
          <button
            type="button"
            onClick={() => onSelect(value)}
            className="font-mono text-xs font-bold tracking-widest text-primary bg-primary/10 border border-primary/30 rounded px-2 py-1"
            aria-label={`Selected stop ${value.iata}, ${value.city}. Click to change.`}
          >
            {value.iata}
          </button>
        )}
        <Search className="size-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
      </div>

      {open && (
        <ul
          className="absolute z-40 mt-2 w-full max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-2xl"
          role="listbox"
          aria-label="Stop results"
        >
          {results.length === 0 && (
            <li className="px-4 py-4 text-sm text-muted-foreground font-mono">
              {mode === "road"
                ? "NO SUCH STOP ON OUR ATLAS — TRY A MAJOR JUNCTION OR STATION"
                : "NO SUCH DESTINATION IN OUR ATLAS — TRY A MAJOR HUB"}
            </li>
          )}
          {results.map((a, i) => (
            <li key={a.iata}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                className={`w-full flex items-center gap-3 px-4 py-3.5 min-h-12 text-left transition-colors ${
                  i === active ? "bg-accent" : "hover:bg-accent/60"
                }`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(a)}
              >
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/30 rounded px-2 py-1 shrink-0">
                  {a.iata}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{a.city}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {a.name} · {a.country}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
