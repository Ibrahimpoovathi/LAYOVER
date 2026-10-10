"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff, Captions } from "lucide-react";

/**
 * THE VISUAL TWIN — DEAF-AWARE (SSR: DEAF) caption feed.
 * Real terminals speak; this one also SHOWS. The strip is a small red
 * LED variable-message board that:
 *   1. captions every TTS gate announcement as it plays (the page feeds
 *      `caption` while `live` is true), and
 *   2. offers LIVE MIC captioning of ambient PA speech via the browser's
 *      speech engine — a judge can speak and watch their words march
 *      across the board.
 * Everything is feature-detected and fails quiet: no mic, no engine,
 * no problem — the announcement captions still work.
 */

type SpeechResultLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechResultLike) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): RecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-IN";
  rec.continuous = true;
  rec.interimResults = true;
  return rec;
}

export function LedCaptionStrip({
  caption,
  live,
}: {
  caption: string | null;
  live: boolean;
}) {
  const [micOn, setMicOn] = useState(false);
  const [micText, setMicText] = useState<string | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);
  const wantMicRef = useRef(false);

  // feature-detect without setState-in-effect (SSR renders "no mic",
  // client snapshot flips it on post-hydration — no mismatch)
  const emptySubscribe = () => () => {};
  const micSupported = useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
    () => false,
  );

  // never leak a running recognizer
  useEffect(
    () => () => {
      wantMicRef.current = false;
      try {
        recRef.current?.stop();
      } catch {
        /* already stopped */
      }
    },
    [],
  );

  function toggleMic() {
    if (micOn) {
      wantMicRef.current = false;
      setMicOn(false);
      try {
        recRef.current?.stop();
      } catch {
        /* already stopped */
      }
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    wantMicRef.current = true;
    setMicOn(true);
    setMicText(null);
    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setMicText((prev) => ((final || interim) ?? "").trim() || prev);
    };
    rec.onerror = () => {
      wantMicRef.current = false;
      setMicOn(false);
    };
    rec.onend = () => {
      if (wantMicRef.current) {
        try {
          rec.start(); // Chrome auto-stops on silence — keep the feed alive
        } catch {
          setMicOn(false);
        }
      }
    };
    try {
      rec.start();
    } catch {
      setMicOn(false);
    }
  }

  const shown = micOn ? (micText ?? "LISTENING FOR ANNOUNCEMENTS…") : caption;

  return (
    <div
      className="led-frame pass-enter relative"
      role="region"
      aria-label="Live announcement captions"
    >
      <span aria-hidden="true" className="led-bolt left-1.5 top-1.5" />
      <span aria-hidden="true" className="led-bolt right-1.5 top-1.5" />
      <div className="led-surface">
        {/* strip header */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-3 pt-2">
          <span className="led-text led-dim flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.3em]">
            <Captions className="size-3.5" aria-hidden="true" />
            CAPTION FEED · SSR DEAF
          </span>
          <span className="flex items-center gap-2">
            {micSupported && (
              <button
                type="button"
                onClick={toggleMic}
                aria-pressed={micOn}
                aria-label={micOn ? "Stop live microphone captions" : "Caption live announcements from the microphone"}
                className={`led-text flex min-h-9 items-center gap-1.5 rounded border border-[#ff3b30]/40 px-2 font-mono text-[9px] font-bold tracking-[0.2em] transition-colors hover:bg-[#ff3b30]/10 sm:min-h-0 sm:py-0.5 ${
                  micOn ? "bg-[#ff3b30]/15" : ""
                }`}
              >
                {micOn ? <MicOff className="size-3" aria-hidden="true" /> : <Mic className="size-3" aria-hidden="true" />}
                {micOn ? "STOP MIC" : "LIVE MIC"}
              </button>
            )}
            <span className="led-text led-dim flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.28em]">
              <span
                aria-hidden="true"
                className={`led-dot ${live || micOn ? "led-blink" : ""}`}
                style={live || micOn ? { background: "#ff3b30" } : { background: "#5a2622" }}
              />
              {live ? "CAPTIONING" : micOn ? "LIVE" : "IDLE"}
            </span>
          </span>
        </div>
        {/* caption line — remounts on change so the LEDs relight */}
        <div
          key={shown ?? "idle"}
          className="relative z-10 min-h-[44px] px-3 pb-2.5 pt-1.5 sm:min-h-[40px]"
        >
          {shown ? (
            <p className="led-text led-relight font-mono text-sm font-bold uppercase leading-snug tracking-[0.08em]">
              {shown}
            </p>
          ) : (
            <p className="led-text font-mono text-sm font-bold uppercase tracking-[0.08em] opacity-30">
              PRESS ANNOUNCE — WORDS APPEAR HERE
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
