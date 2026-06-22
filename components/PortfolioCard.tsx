"use client";

import { RefreshCw, ExternalLink, Wallet, ArrowLeftRight, Shuffle, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { DonutChart } from "./DonutChart";
import { fetchActivities, type ActivityEntry } from "@/lib/supabase";

function formatUsd(val: number): string {
  if (val === 0) return "$0.00";
  if (val >= 1000) return `$${val.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${val.toFixed(2)}`;
}

function formatBalance(val: number, decimals: number): string {
  if (val === 0) return "0.00";
  const maxFrac = decimals <= 6 ? 4 : 6;
  return val.toLocaleString("en-US", { maximumFractionDigits: maxFrac, minimumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function shortenHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

const TYPE_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  swap:   { label: "Swap",   Icon: ArrowLeftRight, color: "#a855f7" },
  bridge: { label: "Bridge", Icon: Shuffle,        color: "#3b82f6" },
  send:   { label: "Send",   Icon: Send,           color: "#10b981" },
};

const PAGE_SIZE = 5;

function TransactionHistory({ address }: { address: string }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (p: number) => {
    setLoading(true);
    const result = await fetchActivities(address, p, PAGE_SIZE);
    setActivities(result.data);
    setTotal(result.total);
    setLoading(false);
  };

  useEffect(() => { void load(page); }, [page, address]);

  function pageNumbers(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(192,132,252,0.45)" }}>Transaction History</p>
          <h2 className="font-display text-base font-bold text-textPrimary mt-0.5">Your activity</h2>
        </div>
        <button
          type="button"
          onClick={() => void load(page)}
          className="rounded-lg p-1.5 transition hover:bg-white/5"
          style={{ color: "rgba(192,132,252,0.4)" }}
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Rows */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: "rgba(168,85,247,0.5)" }} />
        </div>
      ) : activities.length === 0 ? (
        <div className="py-10 text-center text-sm" style={{ color: "rgba(192,132,252,0.4)" }}>
          No transactions yet.
        </div>
      ) : (
        activities.map((tx) => {
          const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.swap;
          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderBottom: "1px solid rgba(168,85,247,0.06)" }}
            >
              {/* Type icon */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
              >
                <cfg.Icon className="h-4 w-4" style={{ color: cfg.color }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-textPrimary">{cfg.label}</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                  >
                    +{tx.points} pts
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "rgba(192,132,252,0.45)" }}>
                  {formatDate(tx.created_at)}
                </p>
              </div>

              {/* Tx hash link */}
              {tx.tx_hash && tx.tx_hash !== "" && (
                <a
                  href={`https://testnet.arcscan.app/tx/${tx.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-mono transition hover:opacity-80 shrink-0"
                  style={{ color: "rgba(192,132,252,0.5)" }}
                >
                  {shortenHash(tx.tx_hash)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        })
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 px-5 py-3"
          style={{ borderTop: "1px solid rgba(168,85,247,0.1)" }}>
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center h-7 px-2 rounded-lg text-xs font-medium transition disabled:opacity-30"
              style={{ color: "rgba(192,132,252,0.7)", border: "1px solid rgba(168,85,247,0.2)" }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />Prev
            </button>

            {pageNumbers().map((n, idx) =>
              n === "…" ? (
                <span key={`e-${idx}`} className="flex h-7 w-5 items-center justify-center text-xs"
                  style={{ color: "rgba(192,132,252,0.4)" }}>…</span>
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
                >{n}</button>
              )
            )}

            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center h-7 px-2 rounded-lg text-xs font-medium transition disabled:opacity-30"
              style={{ color: "rgba(192,132,252,0.7)", border: "1px solid rgba(168,85,247,0.2)" }}
            >
              Next<ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-xs" style={{ color: "rgba(192,132,252,0.45)" }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} transactions
          </span>
        </div>
      )}
    </div>
  );
}

export function PortfolioCard() {
  const { isConnected, address } = useAccount();
  const { holdings, totalUsd, isLoading, refetch } = usePortfolio();

  const segments    = holdings.map(h => ({ color: h.token.color, pct: h.pct }));
  const activeCount = holdings.filter(h => h.balance > 0).length;

  if (!isConnected) {
    return (
      <div className="w-full max-w-2xl">
        <div className="glass-card flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.2)" }}
          >
            <Wallet className="h-8 w-8" style={{ color: "#a855f7" }} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-textPrimary">Connect your wallet</p>
            <p className="mt-1 text-sm" style={{ color: "rgba(192,132,252,0.5)" }}>
              Connect to view your Arc Testnet portfolio
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-4">

      {/* ── Allocation card ─────────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(192,132,252,0.45)" }}>Portfolio Allocation</p>
            <h2 className="font-display text-xl font-bold text-textPrimary mt-0.5">Arc asset mix</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg p-1.5 transition hover:bg-white/5"
              style={{ color: "rgba(192,132,252,0.4)" }}
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <div
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.2)", color: "rgba(192,132,252,0.8)" }}
            >
              {holdings.length} assets
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <DonutChart
              segments={segments}
              size={180}
              thickness={26}
              label={isLoading ? "…" : `${activeCount}`}
              sublabel={activeCount === 1 ? "ASSET" : "ASSETS"}
            />
          </div>
          <div className="flex-1 w-full space-y-2">
            {holdings.map(h => (
              <div key={h.token.symbol}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(168,85,247,0.1)" }}>
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: h.token.color, boxShadow: `0 0 6px ${h.token.color}80` }} />
                  <div>
                    <p className="text-sm font-semibold text-textPrimary">{h.token.symbol}</p>
                    <p className="text-xs" style={{ color: "rgba(192,132,252,0.45)" }}>
                      {isLoading ? "…" : `${formatBalance(h.balance, h.token.decimals)} ${h.token.symbol}`}
                      {" / "}
                      {isLoading ? "…" : formatUsd(h.usdValue)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums"
                  style={{ color: h.pct > 0 ? "rgba(192,132,252,0.9)" : "rgba(192,132,252,0.3)" }}>
                  {isLoading ? "…" : `${h.pct.toFixed(1)}%`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs" style={{ color: "rgba(192,132,252,0.35)" }}>
          Allocation is generated from real Arc Testnet USDC, EURC, and cirBTC balances.
        </p>
      </div>

      {/* ── Total value bar ──────────────────────────────────────────────── */}
      <div className="glass-card flex items-center justify-between px-5 py-3.5">
        <div>
          <p className="text-xs" style={{ color: "rgba(192,132,252,0.45)" }}>Total portfolio value</p>
          <p className="font-display text-2xl font-bold text-textPrimary mt-0.5">
            {isLoading ? "…" : formatUsd(totalUsd)}
          </p>
        </div>
        <a
          href={`https://testnet.arcscan.app/address/${address}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition hover:bg-white/5"
          style={{ color: "rgba(192,132,252,0.5)", border: "1px solid rgba(168,85,247,0.15)" }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View on ArcScan
        </a>
      </div>

      {/* ── Transaction History ───────────────────────────────────────────── */}
      <TransactionHistory address={address!} />
    </div>
  );
}
