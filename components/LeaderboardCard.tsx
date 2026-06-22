"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { RefreshCw, ArrowLeftRight, Shuffle, Send, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchLeaderboard, POINTS, type LeaderboardEntry } from "@/lib/supabase";

const PAGE_SIZE = 10;

function formatPoints(pts: number): string {
  if (pts >= 1000) return `${(pts / 1000).toFixed(1)}K`;
  return pts.toString();
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getRankBadge(rank: number) {
  if (rank === 1) return { emoji: "🥇", label: "Diamond Trader", color: "#fbbf24" };
  if (rank === 2) return { emoji: "🥈", label: "Gold Trader",    color: "#a78bfa" };
  if (rank === 3) return { emoji: "🥉", label: "Silver Trader",  color: "#94a3b8" };
  if (rank <= 10) return { emoji: "",   label: "Bronze Trader",  color: "#f97316" };
  return                 { emoji: "",   label: "Trader",          color: "rgba(192,132,252,0.6)" };
}

function Avatar({ address, color }: { address: string; color: string }) {
  const letter = address[2]?.toUpperCase() ?? "?";
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ background: `${color}30`, border: `1.5px solid ${color}60`, color }}
    >
      {letter}
    </div>
  );
}

export function LeaderboardCard() {
  const { address: myAddress } = useAccount();
  const [entries, setEntries]   = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page,    setPage]      = useState(1);

  const load = async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageEntries = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const myRank = myAddress
    ? entries.findIndex(e => e.address === myAddress.toLowerCase()) + 1
    : 0;

  return (
    <div className="w-full max-w-2xl space-y-4">

      {/* ── How to earn points ─────────────────────────────────────────── */}
      <div className="glass-card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "rgba(192,132,252,0.45)" }}>
          How to earn points
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ArrowLeftRight, label: "Every Swap",   pts: POINTS.swap   },
            { icon: Shuffle,        label: "Every Bridge", pts: POINTS.bridge },
            { icon: Send,           label: "Every Send",   pts: POINTS.send   },
          ].map(({ icon: Icon, label, pts }) => (
            <div key={label}
              className="flex flex-col items-start gap-1.5 rounded-xl p-3"
              style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
              <Icon className="h-5 w-5" style={{ color: "#a855f7" }} />
              <span className="text-sm font-bold" style={{ color: "#c084fc" }}>
                +{pts} pts
              </span>
              <span className="text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── My rank ────────────────────────────────────────────────────── */}
      {myAddress && myRank > 0 && (
        <div className="glass-card flex items-center justify-between px-5 py-3"
          style={{ border: "1px solid rgba(168,85,247,0.3)" }}>
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5" style={{ color: "#a855f7" }} />
            <div>
              <p className="text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>Your rank</p>
              <p className="font-display text-lg font-bold text-textPrimary">#{myRank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>Points</p>
            <p className="font-display text-lg font-bold" style={{ color: "#a855f7" }}>
              {formatPoints(entries[myRank - 1]?.total_points ?? 0)}
            </p>
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2rem_1fr_6rem_5rem_4rem] gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "rgba(192,132,252,0.4)", borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
          <span>#</span>
          <span>Trader</span>
          <span className="text-right">Score</span>
          <span className="text-right hidden sm:block">Actions</span>
          <span className="text-right hidden sm:block">Pts</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "rgba(168,85,247,0.5)" }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "rgba(192,132,252,0.4)" }}>
            No activity yet. Be the first to earn points!
          </div>
        ) : (
          pageEntries.map((entry, i) => {
            const rank  = (page - 1) * PAGE_SIZE + i + 1; // global rank
            const badge = getRankBadge(rank);
            const isMe  = myAddress?.toLowerCase() === entry.address;
            const totalActions = entry.swap_count + entry.bridge_count + entry.send_count;

            return (
              <div
                key={entry.address}
                className="grid grid-cols-[2rem_1fr_6rem_5rem_4rem] items-center gap-2 px-5 py-3.5 transition-colors"
                style={{
                  borderBottom: "1px solid rgba(168,85,247,0.06)",
                  background: isMe ? "rgba(168,85,247,0.08)" : "transparent",
                }}
              >
                {/* Rank */}
                <div className="text-sm font-semibold" style={{ color: badge.color }}>
                  {badge.emoji || rank}
                </div>

                {/* Address + badge */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar address={entry.address} color={badge.color} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-textPrimary font-mono">
                        {shortenAddress(entry.address)}
                      </span>
                      {isMe && (
                        <span className="rounded px-1 py-0.5 text-[10px] font-bold"
                          style={{ background: "rgba(168,85,247,0.25)", color: "#c084fc" }}>
                          you
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: badge.color + "99" }}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right font-display font-bold text-base"
                  style={{ color: "#c084fc" }}>
                  {formatPoints(entry.total_points)}
                </div>

                {/* Action count */}
                <div className="text-right text-sm hidden sm:block"
                  style={{ color: "rgba(192,132,252,0.6)" }}>
                  {totalActions}
                </div>

                {/* Raw points */}
                <div className="text-right text-xs hidden sm:block"
                  style={{ color: "rgba(192,132,252,0.4)" }}>
                  {entry.total_points}
                </div>
              </div>
            );
          })
        )}

        {/* ── Pagination controls ─────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div
            className="flex flex-col items-center gap-2 px-5 py-3"
            style={{ borderTop: "1px solid rgba(168,85,247,0.1)" }}
          >
            {/* Prev / page numbers / Next */}
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {/* Prev */}
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-0.5 h-7 px-2 rounded-lg text-xs font-medium transition disabled:opacity-30"
                style={{ color: "rgba(192,132,252,0.7)", border: "1px solid rgba(168,85,247,0.2)" }}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>

              {/* Smart page numbers: 1 … (page-1) page (page+1) … last */}
              {(() => {
                const pages: (number | "…")[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push("…");
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                    pages.push(i);
                  }
                  if (page < totalPages - 2) pages.push("…");
                  pages.push(totalPages);
                }
                return pages.map((n, idx) =>
                  n === "…" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="flex h-7 w-5 items-center justify-center text-xs"
                      style={{ color: "rgba(192,132,252,0.4)" }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n as number)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition"
                      style={
                        n === page
                          ? { background: "rgba(168,85,247,0.3)", color: "#f3e8ff", border: "1px solid rgba(168,85,247,0.5)" }
                          : { color: "rgba(192,132,252,0.6)", border: "1px solid rgba(168,85,247,0.15)" }
                      }
                    >
                      {n}
                    </button>
                  )
                );
              })()}

              {/* Next */}
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-0.5 h-7 px-2 rounded-lg text-xs font-medium transition disabled:opacity-30"
                style={{ color: "rgba(192,132,252,0.7)", border: "1px solid rgba(168,85,247,0.2)" }}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Page info */}
            <span className="text-xs" style={{ color: "rgba(192,132,252,0.45)" }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, entries.length)} of {entries.length} traders
            </span>
          </div>
        )}
      </div>

      {/* Refresh */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => { setPage(1); void load(); }}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition"
          style={{ color: "rgba(192,132,252,0.5)", border: "1px solid rgba(168,85,247,0.15)" }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    </div>
  );
}
