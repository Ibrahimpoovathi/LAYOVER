"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff, Captions, Radio } from "lucide-react";

/**
 * THE VISUAL TWIN — DEAF-AWARE (SSR: DEAF) caption feed.
 * Real terminals speak; this one also SHOWS. The strip is a small red
 * LED variable-message board that:
 *   1. captions every TTS gate announcement as it plays (the page feeds
 *      `caption` while `live` is true), and
 *   2. offers LIVE MIC captioning of ambient PA speech through TWO engines:
 *        ENGINE A — the browser's SpeechRecognition (realtime, Chrome).
 *        ENGINE B — MediaRecorder clips → /api/ai/transcribe (server ASR),
 *                   used when the browser engine is missing or network-dead
 *                   (Firefox, Safari, sandboxed iframes).
 *   3. NEVER fails quiet: whatever goes wrong (mic blocked, engine missing,
 *      channel resting) is printed on the board itself, like a real LED
 *      advisory would.
 */

type SpeechResultLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type SpeechErrorLike = { error?: string };

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechResultLike) => void) | null;
  onerror: ((e: SpeechErrorLike) => void) | null;
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

/** ArrayBuffer → base64 without blowing the stack on big clips. */
function bytesToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m));
}

/** Keep only the tail — the LED strip is one line. */
function tail(s: string, max = 150): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > max ? `…${clean.slice(-max + 1)}` : clean;
}

type Engine = "browser" | "asr";

export function LedCaptionStrip({
  caption,
  live,
}: {
  caption: string | null;
  live: boolean;
}) {
  const [micOn, setMicOn] = useState(false);
  const [micText, setMicText] = useState<string | null>(null);
  /** honest machine: every abnormal state is printed here, on the board */
  const [micStatus, setMicStatus] = useState<string | null>(null);
  const [recording, setRecording] = useState(false); // engine B clip in progress

  const recRef = useRef<RecognitionLike | null>(null);
  const wantMicRef = useRef(false);
  const engineRef = useRef<Engine>("browser");

  // engine B wiring
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const segBusyRef = useRef(false);
  const segTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // feature-detect without setState-in-effect (SSR renders "no mic",
  // client snapshot flips it on post-hydration — no mismatch)
  const emptySubscribe = () => () => {};
  const browserEngine = useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
    () => false,
  );
  const recorderEngine = useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    () => false,
  );

  function stopAllEngines() {
    wantMicRef.current = false;
    if (segTimerRef.current) {
      clearInterval(segTimerRef.current);
      segTimerRef.current = null;
    }
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    recRef.current = null;
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    } catch {
      /* already stopped */
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
  }

  // never leak a running recognizer / recorder / stream
  useEffect(
    () => () => {
      stopAllEngines();
    },
    [],
  );

  // ── ENGINE B — MediaRecorder clip → server ASR ─────────────────────────
  async function transcribeClip(blob: Blob) {
    const b64 = bytesToBase64(await blob.arrayBuffer());
    const res = await fetch("/api/ai/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: b64, mime: blob.type }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? `caption channel ${res.status}`);
    }
    return (await res.json()) as { ok: boolean; text?: string; empty?: boolean };
  }

  async function sealSegment() {
    if (segBusyRef.current) return;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    segBusyRef.current = true;
    try {
      recorder.stop(); // onstop flushes chunks → transcribe → restart
    } finally {
      segBusyRef.current = false;
    }
  }

  async function runAsrEngine() {
    engineRef.current = "asr";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!wantMicRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      setMicStatus("SERVER ASR LISTENING — CLIPS TRANSCRIBED EVERY FEW SECONDS");
      await startSegment();
      // roll the recorder every 7 s so speech becomes captions in near-realtime
      segTimerRef.current = setInterval(() => void sealSegment(), 7_000);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setMicOn(false);
        setMicStatus("MIC BLOCKED BY THE BROWSER — ALLOW MICROPHONE, OR OPEN THIS PAGE IN A NEW TAB");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setMicOn(false);
        setMicStatus("NO MICROPHONE FOUND ON THIS DEVICE");
      } else {
        setMicOn(false);
        setMicStatus("MICROPHONE UNAVAILABLE — ANNOUNCEMENT CAPTIONS STILL WORK");
      }
    }
  }

  async function startSegment() {
    const stream = streamRef.current;
    if (!stream || !wantMicRef.current) return;
    const mime = pickRecorderMime();
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      setRecording(false);
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      chunksRef.current = [];
      if (blob.size < 1200 || !wantMicRef.current) return; // silence guard
      setRecording(true);
      try {
        const data = await transcribeClip(blob);
        if (!wantMicRef.current) return;
        if (data.empty || !data.text) {
          setMicStatus("PA SIGNAL UNCLEAR — TRY SPEAKING CLOSER");
        } else {
          setMicStatus(null);
          setMicText((prev) => tail(`${prev ? prev + " " : ""}${data.text}`));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "caption channel failure";
        setMicOn(false);
        setMicStatus(`CAPTION CHANNEL DOWN — ${tail(msg, 90).toUpperCase()}`);
      } finally {
        setRecording(false);
        // chain the next segment while the mic is still wanted
        if (wantMicRef.current && engineRef.current === "asr") {
          try {
            await startSegment();
          } catch {
            /* stream gone — stopAllEngines handles the rest */
          }
        }
      }
    };
    recorder.start();
    setRecording(true);
  }

  // ── ENGINE A — browser SpeechRecognition (realtime) ────────────────────
  function startBrowserEngine() {
    engineRef.current = "browser";
    const rec = getRecognition();
    if (!rec) {
      // no browser engine → straight to the honest server engine
      void runAsrEngine();
      return;
    }
    recRef.current = rec;
    wantMicRef.current = true;
    setMicOn(true);
    setMicText(null);
    setMicStatus("BROWSER STT LISTENING — SPEAK NEAR THE MIC");
    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      const piece = (final || interim).trim();
      if (piece) {
        setMicStatus(null);
        setMicText((prev) => tail(final ? `${prev ? prev + " " : ""}${final}` : `${prev ?? ""}${piece}`));
      }
    };
    rec.onerror = (e) => {
      const code = e.error ?? "";
      if (code === "no-speech" || code === "aborted") return; // onend keeps the feed alive
      if (code === "not-allowed" || code === "service-not-allowed") {
        // mic blocked for the browser engine — the server engine will tell
        // us exactly what the platform allows (permission / hardware)
        recRef.current = null;
        void runAsrEngine();
        return;
      }
      if (code === "network") {
        // browser STT needs Google's endpoints; our own backend is closer
        recRef.current = null;
        void runAsrEngine();
        return;
      }
      if (code === "audio-capture") {
        setMicOn(false);
        setMicStatus("NO MICROPHONE FOUND ON THIS DEVICE");
        wantMicRef.current = false;
        return;
      }
      // anything else — surface it, stay up
      setMicStatus(`STT FAULT (${code.toUpperCase()}) — SWITCHING TO SERVER ASR`);
      recRef.current = null;
      void runAsrEngine();
    };
    rec.onend = () => {
      if (wantMicRef.current && engineRef.current === "browser" && recRef.current) {
        try {
          rec.start(); // Chrome auto-stops on silence — keep the feed alive
        } catch {
          /* restart race — onend fires again */
        }
      }
    };
    try {
      rec.start();
    } catch {
      recRef.current = null;
      void runAsrEngine();
    }
  }

  function toggleMic() {
    if (micOn) {
      stopAllEngines();
      setMicOn(false);
      setMicStatus(null);
      return;
    }
    setMicText(null);
    setMicStatus(null);
    if (!browserEngine && !recorderEngine) {
      setMicOn(false);
      setMicStatus("NO SPEECH ENGINE IN THIS BROWSER — TRY CHROME, OR READ THE BOARD: ANNOUNCEMENTS CAPTION HERE");
      return;
    }
    wantMicRef.current = true;
    setMicOn(true);
    startBrowserEngine();
  }

  const statusShown = micStatus ?? (micOn ? (recording ? "TRANSCRIBING…" : null) : null);
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
            {(browserEngine || recorderEngine) && (
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
        {/* status line — the honest machine prints its own faults */}
        {statusShown && (
          <p
            className="led-text led-dim relative z-10 flex items-center gap-1.5 px-3 pt-1.5 font-mono text-[9px] font-bold tracking-[0.14em]"
            role="status"
          >
            <Radio className="size-3 shrink-0" aria-hidden="true" />
            {statusShown}
          </p>
        )}
        {/* caption line — remounts on change so the LEDs relight */}
        <div
          key={shown ?? "idle"}
          className="relative z-10 min-h-[44px] px-3 pb-2.5 pt-1.5 sm:min-h-[40px]"
          aria-live="polite"
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
