"use client";

import Image from "next/image";
import { RefreshCw, ExternalLink, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { usePortfolio } from "@/hooks/usePortfolio";
import { DonutChart } from "./DonutChart";

function TokenAvatar({ symbol, color }: { symbol: string; color: string }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
      style={{ background: `${color}30`, border: `1px solid ${color}50`, color }}
    >
      {symbol[0]}
    </div>
  );
}

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

export function PortfolioCard() {
  const { isConnected, address } = useAccount();
  const { holdings, totalUsd, nonZeroCount, isLoading, refetch } = usePortfolio();

  const segments = holdings.map(h => ({ color: h.token.color, pct: h.pct }));
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
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(192,132,252,0.45)" }}>
              Portfolio Allocation
            </p>
            <h2 className="font-display text-xl font-bold text-textPrimary mt-0.5">
              Arc asset mix
            </h2>
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

        {/* Chart + allocation list */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Donut */}
          <div className="shrink-0">
            <DonutChart
              segments={segments}
              size={180}
              thickness={26}
              label={isLoading ? "…" : `${activeCount}`}
              sublabel={activeCount === 1 ? "ASSET" : "ASSETS"}
            />
          </div>

          {/* Allocation rows */}
          <div className="flex-1 w-full space-y-2">
            {holdings.map(h => (
              <div
                key={h.token.symbol}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(168,85,247,0.1)" }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: h.token.color, boxShadow: `0 0 6px ${h.token.color}80` }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-textPrimary">{h.token.symbol}</p>
                    <p className="text-xs" style={{ color: "rgba(192,132,252,0.45)" }}>
                      {isLoading ? "…" : `${formatBalance(h.balance, h.token.decimals)} ${h.token.symbol}`}
                      {" / "}
                      {isLoading ? "…" : formatUsd(h.usdValue)}
                    </p>
                  </div>
                </div>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: h.pct > 0 ? "rgba(192,132,252,0.9)" : "rgba(192,132,252,0.3)" }}
                >
                  {isLoading ? "…" : `${h.pct.toFixed(1)}%`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-xs" style={{ color: "rgba(192,132,252,0.35)" }}>
          Allocation is generated from real Arc Testnet USDC, EURC, and cirBTC balances.
        </p>
      </div>

      {/* ── Total value bar ──────────────────────────────────────────────── */}
      <div
        className="glass-card flex items-center justify-between px-5 py-3.5"
      >
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

      {/* ── Token rows ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {holdings.map(h => (
          <div
            key={h.token.symbol}
            className="glass-card flex items-center gap-4 px-5 py-4"
          >
            {/* Icon / avatar */}
            {h.token.icon ? (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${h.token.color}18`, border: `1px solid ${h.token.color}30` }}
              >
                <Image
                  src={h.token.icon}
                  alt={h.token.symbol}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              </div>
            ) : (
              <TokenAvatar symbol={h.token.symbol} color={h.token.color} />
            )}

            {/* Name + description */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-textPrimary">{h.token.symbol}</p>
              <p className="text-xs truncate" style={{ color: "rgba(192,132,252,0.45)" }}>
                {h.token.description}
              </p>
            </div>

            {/* Balance */}
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-textPrimary tabular-nums">
                {isLoading
                  ? <span className="animate-pulse opacity-40">…</span>
                  : `${formatBalance(h.balance, h.token.decimals)} ${h.token.symbol}`
                }
              </p>
              <p className="text-xs tabular-nums" style={{ color: "rgba(192,132,252,0.4)" }}>
                {isLoading ? "" : formatUsd(h.usdValue)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Faucet hint ──────────────────────────────────────────────────── */}
      {!isLoading && nonZeroCount === 0 && (
        <div
          className="glass-card px-5 py-4 text-center"
        >
          <p className="text-sm" style={{ color: "rgba(192,132,252,0.5)" }}>
            No tokens found on Arc Testnet.{" "}
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold hover:text-purple-300 transition-colors underline"
              style={{ color: "rgba(168,85,247,0.8)" }}
            >
              Get test tokens from the faucet
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
