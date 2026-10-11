"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, MessageSquareText, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { missionKeyOf } from "@/lib/review-key";

/**
 * CREW REVIEWS — "is this task worth it?"
 *
 * Every mission row gets a star chip: ★ 4.5 (7) or ☆ RATE IT.
 * Opening it shows the crew verdicts for THAT TASK (grouped by
 * title+location across all trips) and — if logged in — a rate form:
 *   • 1–5 stars
 *   • a cost verdict chip: WORTH IT / PRICEY / SKIP IT
 *   • an optional short field note ("₹60 for three pieces, still worth it")
 * Reading is public. Writing requires CREW LOGIN (same gate as badges).
 */

export interface ReviewSummary {
  avg: number | null;
  count: number;
}

interface ReviewRow {
  id: string;
  nickname: string;
  rating: number;
  verdict: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReviewDetail {
  ok: boolean;
  key: string;
  avg: number | null;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: ReviewRow[];
  mine: { rating: number; verdict: string | null; comment: string | null } | null;
  error?: string;
}

const VERDICT_META: Record<string, { label: string; ink: string }> = {
  WORTH_IT: { label: "WORTH IT", ink: "#2d7d74" },
  PRICEY: { label: "PRICEY", ink: "#8a6d3b" },
  SKIP: { label: "SKIP IT", ink: "#c2452d" },
};

/** Bulk star summaries for every mission row on a plan — one GET total. */
export function useReviewSummaries(keys: string[]) {
  const stable = keys.join("\u0000");
  const [summaries, setSummaries] = useState<Record<string, ReviewSummary>>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!stable) return;
    const list = stable.split("\u0000");
    let alive = true;
    fetch(`/api/reviews/summary?keys=${encodeURIComponent(JSON.stringify(list))}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive && d?.ok) setSummaries(d.summaries ?? {});
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [stable, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return { summaries, refresh };
}

function StarRow({ value, size }: { value: number; size: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= Math.round(value) ? "text-[#f5a623]" : "text-foreground/25"}
          fill={n <= Math.round(value) ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    .toUpperCase();
}

function ReviewChip({
  label,
  filled,
  light,
}: {
  label: string;
  filled: boolean;
  light: boolean;
}) {
  return (
    <>
      <Star
        className={`size-3 ${filled ? "" : "opacity-70"}`}
        fill={filled ? "currentColor" : "none"}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span>{label}</span>
      <PenLine className={`size-2.5 ${light ? "opacity-50" : "opacity-50"}`} aria-hidden="true" />
    </>
  );
}

/** One mission row's review affordance: the chip + the verdict dialog. */
export function MissionReview({
  title,
  location,
  missionId,
  summary,
  light,
  crew,
  onPosted,
}: {
  title: string;
  location: string;
  /** DB id of this mission instance, when it has been archived (optional). */
  missionId?: string;
  /** Pre-fetched bulk summary for the chip (undefined → still fetchable via dialog). */
  summary?: ReviewSummary;
  /** true = ink-on-paper (inside the pass/ticket), false = terminal style. */
  light?: boolean;
  crew: { id: string; nickname: string } | null;
  /** Called after a successful post so the row chip re-renders. */
  onPosted?: () => void;
}) {
  const { toast } = useToast();
  const key = useMemo(() => missionKeyOf(title, location), [title, location]);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const chipLabel =
    summary && summary.count > 0 && summary.avg != null
      ? `${summary.avg.toFixed(1)} (${summary.count})`
      : "RATE IT";
  const chipFilled = !!summary && summary.count > 0 && summary.avg != null;

  function loadDetail() {
    setLoading(true);
    const q = new URLSearchParams({ key });
    if (crew?.id) q.set("travelerId", crew.id);
    fetch(`/api/reviews?${q.toString()}`)
      .then((r) => r.json())
      .then((d: ReviewDetail) => {
        setDetail(d);
        if (d?.mine) {
          setRating(d.mine.rating);
          setVerdict(d.mine.verdict);
          setComment(d.mine.comment ?? "");
        } else {
          setRating(0);
          setVerdict(null);
          setComment("");
        }
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }

  function handleOpen(next: boolean) {
    setOpen(next);
    if (next) loadDetail();
  }

  async function post() {
    if (!crew || rating < 1) return;
    setPosting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelerId: crew.id,
          rating,
          verdict,
          comment: comment.trim() || null,
          missionId: missionId ?? null,
          key,
          title,
          location,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast({
          title: "VERDICT REJECTED",
          description: String(data.error ?? "The review desk jammed"),
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "VERDICT FILED",
        description: `${crew.nickname} · ${rating}★ — thanks for keeping the board honest.`,
      });
      loadDetail();
      onPosted?.();
    } catch {
      toast({
        title: "VERDICT REJECTED",
        description: "Could not reach the review desk — check the wire.",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  }

  const chipClass = light
    ? "border-[#8a6d3b]/50 text-[#8a6d3b] hover:bg-[#8a6d3b]/10"
    : "border-border text-primary hover:bg-primary/10";

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`inline-flex min-h-8 items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest transition-colors ${chipClass}`}
          title="Crew verdicts — is this task worth it?"
          aria-label={`Reviews for ${title}: ${chipFilled ? `${summary?.avg} stars from ${summary?.count} crew` : "no reviews yet, rate it"}`}
        >
          <ReviewChip label={chipLabel} filled={chipFilled} light={!!light} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto font-mono sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left text-base tracking-wide">
            <MessageSquareText className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="line-clamp-2">CREW VERDICTS — {title}</span>
          </DialogTitle>
          <DialogDescription className="text-left text-[11px] tracking-widest text-muted-foreground">
            {location} · REVIEWS FOLLOW THE TASK, NOT YOUR TRIP
          </DialogDescription>
        </DialogHeader>

        {loading && !detail && (
          <p className="py-6 text-center text-xs tracking-widest text-muted-foreground">
            PULLING THE VERDICT LEDGER…
          </p>
        )}

        {detail && (
          <>
            {/* summary strip */}
            <div className="flex items-center justify-between gap-4 rounded-md border bg-card/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold leading-none">
                  {detail.count > 0 ? detail.avg!.toFixed(1) : "—"}
                </span>
                <div>
                  <StarRow value={detail.avg ?? 0} size={13} />
                  <p className="mt-1 text-[10px] tracking-widest text-muted-foreground">
                    {detail.count} CREW VERDICT{detail.count === 1 ? "" : "S"}
                  </p>
                </div>
              </div>
              {/* distribution */}
              <div className="min-w-[110px] space-y-0.5">
                {([5, 4, 3, 2, 1] as const).map((n) => (
                  <div key={n} className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                    <span className="w-3 text-right">{n}★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-sm bg-muted">
                      <span
                        className="block h-full bg-[#f5a623]"
                        style={{
                          width: `${detail.count ? (detail.distribution[n] / detail.count) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    <span className="w-3">{detail.distribution[n]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* review list */}
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1" aria-label="Crew reviews list">
              {detail.count === 0 && (
                <p className="rounded-md border border-dashed py-6 text-center text-[11px] tracking-widest text-muted-foreground">
                  NO VERDICTS YET — BE THE FIRST CREW TO RATE THIS TASK
                </p>
              )}
              {detail.reviews.map((r) => {
                const v = r.verdict ? VERDICT_META[r.verdict] : null;
                return (
                  <div key={r.id} className="rounded-md border px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <span className="text-[11px] font-bold tracking-widest">{r.nickname}</span>
                      <span className="flex items-center gap-2">
                        <StarRow value={r.rating} size={10} />
                        {v && (
                          <span
                            className="rounded border px-1 py-px text-[8px] font-bold tracking-widest"
                            style={{ color: v.ink, borderColor: v.ink }}
                          >
                            {v.label}
                          </span>
                        )}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">
                        “{r.comment}”
                      </p>
                    )}
                    <p className="mt-0.5 text-[8px] tracking-widest text-muted-foreground">
                      FILED {fmtWhen(r.updatedAt || r.createdAt)}
                      {crew && r.nickname === crew.nickname ? " · YOU" : ""}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* rate form */}
            <div className="rounded-md border border-dashed p-3">
              <p className="mb-2 text-[10px] font-bold tracking-[0.25em] text-muted-foreground">
                {detail.mine ? "UPDATE YOUR VERDICT" : "FILE YOUR VERDICT"}
              </p>
              {crew ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={rating === n}
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                        onClick={() => setRating(n)}
                        className="rounded p-1 transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={`size-6 ${n <= rating ? "text-[#f5a623]" : "text-muted-foreground/40"}`}
                          fill={n <= rating ? "currentColor" : "none"}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(VERDICT_META).map(([value, meta]) => {
                      const active = verdict === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setVerdict(active ? null : value)}
                          className="rounded border px-2 py-1 text-[9px] font-bold tracking-widest transition-colors"
                          style={{
                            color: active ? "#0b0b0d" : meta.ink,
                            backgroundColor: active ? meta.ink : "transparent",
                            borderColor: meta.ink,
                          }}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 240))}
                    placeholder="Was it worth the money? The queue? The taste? Keep it short — field notes."
                    rows={2}
                    className="resize-none text-xs"
                    aria-label="Review comment (optional)"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] tracking-widest text-muted-foreground">
                      {comment.length}/240
                    </span>
                    <Button
                      size="sm"
                      onClick={post}
                      disabled={rating < 1 || posting}
                      className="min-h-9 font-mono text-[10px] tracking-widest"
                    >
                      {posting ? "FILING…" : detail.mine ? "UPDATE VERDICT" : "POST VERDICT"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="py-1 text-[11px] leading-relaxed tracking-wide text-muted-foreground">
                  CREW LOGIN NEEDED — claim a callsign at the top of the page (4-digit PIN) to
                  file a verdict. Reading everyone else&apos;s is free.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
