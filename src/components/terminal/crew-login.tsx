"use client";

import { useCallback, useEffect, useState } from "react";
import { IdCard, LogOut, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";

/**
 * THE CREW GATE — login that makes the leaderboard personal.
 *
 * A judge claims a CALLSIGN with a 4-digit CREW PIN (airport staff code
 * flavor, sha256-hashed server-side). From that moment every stamped
 * mission banks a badge to their crew account, and the two leaderboard
 * boards (per AIRPORT + OVERALL) rank them live.
 *
 * The chip lives in the header: "CREW LOGIN" before, "CALLSIGN · N BADGES"
 * after — the gamification is always one glance away.
 */

export interface Crew {
  id: string;
  nickname: string;
}

export function CrewChip({
  crew,
  onLogin,
  onLogout,
  refreshKey = 0,
}: {
  crew: Crew | null;
  onLogin: (crew: Crew) => void;
  onLogout: () => void;
  refreshKey?: number;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [callsign, setCallsign] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badges, setBadges] = useState<number | null>(null);

  // keep the chip's badge count honest: refetch on login, on every badge
  // event (refreshKey bumps), and when the dialog reopens
  const refreshBadges = useCallback(() => {
    if (!crew?.id) return;
    fetch(`/api/auth/login?id=${encodeURIComponent(crew.id)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok && d.traveler) setBadges(d.traveler.badges);
      })
      .catch(() => {});
  }, [crew?.id]);

  useEffect(() => {
    refreshBadges();
  }, [refreshBadges, refreshKey]);

  useEffect(() => {
    if (open && crew) refreshBadges();
  }, [open, crew, refreshBadges]);

  function openGate() {
    setCallsign(crew?.nickname ?? "");
    setPin("");
    setError(null);
    setOpen(true);
  }

  async function board() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: callsign, pin }),
      });
      const data = await res.json();
      if (!data.ok || !data.traveler) {
        setError(data.error ?? "The crew gate didn't open — try again");
        return;
      }
      const t = data.traveler;
      onLogin({ id: t.id, nickname: t.nickname });
      setBadges(t.badges);
      setOpen(false);
      toast({
        title: `WELCOME ABOARD · ${t.nickname.toUpperCase()}`,
        description: `${t.badges} badge${t.badges === 1 ? "" : "s"} on record. Every stamped mission now banks to your callsign.`,
      });
    } catch {
      setError("Network down — the gate can't reach the tower");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setOpen(false);
    setBadges(null);
    onLogout();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? openGate() : setOpen(false))}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={crew ? "outline" : "ghost"}
          onClick={openGate}
          aria-label={crew ? `Crew ${crew.nickname}, ${badges ?? "?"} badges — open crew gate` : "Crew login"}
          className="min-h-9 gap-1.5 px-2 font-mono text-[10px] tracking-[0.18em] sm:min-h-0"
          title="Crew login — claim a callsign, collect badges, climb the leaderboard"
        >
          {crew ? <Award className="size-3.5" aria-hidden="true" /> : <IdCard className="size-4" aria-hidden="true" />}
          {crew ? (
            <>
              <span className="hidden max-w-[90px] truncate sm:inline">{crew.nickname.toUpperCase()}</span>
              <span className="text-primary">{badges ?? "…"} ✦</span>
            </>
          ) : (
            <span className="hidden sm:inline">CREW LOGIN</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="font-mono sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="tracking-[0.25em]">CREW GATE</DialogTitle>
          <DialogDescription>
            {crew
              ? `On duty as ${crew.nickname.toUpperCase()} — ${badges ?? "?"} badges banked.`
              : "Claim a callsign to bank badges and climb the leaderboard. New callsign? The PIN claims it. Returning? Same callsign + PIN."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-2">
            <label htmlFor="crew-callsign" className="text-[10px] tracking-[0.25em] text-muted-foreground">
              CALLSIGN
            </label>
            <Input
              id="crew-callsign"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.slice(0, 20))}
              placeholder="CAPTAIN-CHAI"
              autoComplete="username"
              className="uppercase"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="crew-pin" className="text-[10px] tracking-[0.25em] text-muted-foreground">
              CREW PIN · 4 DIGITS
            </label>
            <InputOTP
              id="crew-pin"
              maxLength={4}
              value={pin}
              onChange={(v: string) => setPin(v.replace(/\D/g, "").slice(0, 4))}
              aria-label="Crew PIN, four digits"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error && (
            <p role="alert" className="text-xs font-bold tracking-widest text-destructive">
              ⚠ {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {crew && (
            <Button variant="ghost" onClick={logout} className="font-mono text-xs tracking-widest">
              <LogOut className="size-4" aria-hidden="true" />
              LOGOUT
            </Button>
          )}
          <Button
            onClick={board}
            disabled={busy || callsign.trim().length < 2 || pin.length !== 4}
            className="font-mono text-xs tracking-widest"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <IdCard className="size-4" aria-hidden="true" />}
            {crew ? "SWITCH / REFRESH" : "BOARD AS CREW"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
