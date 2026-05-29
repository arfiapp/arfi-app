"use client";

import Image from "next/image";
import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { TokenInfo } from "@/lib/tokens";
import { TOKENS } from "@/lib/tokens";

type Props = {
  selected: TokenInfo;
  onSelect: (token: TokenInfo) => void;
  disabled?: boolean;
};

export function TokenSelector({ selected, onSelect, disabled }: Props) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOKENS;
    return TOKENS.filter(t => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="token-btn shrink-0"
      >
        <Image src={selected.icon} alt={selected.symbol} width={18} height={18} className="rounded-full" />
        <span>{selected.symbol}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="glass-card w-full max-w-xs p-4">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-textPrimary">Select token</h3>
              <button
                type="button"
                onClick={() => { setOpen(false); setQuery(""); }}
                className="rounded-lg p-1 transition hover:bg-white/5"
                style={{ color: "rgba(192,132,252,0.5)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "rgba(192,132,252,0.4)" }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-xl py-2 pl-8 pr-3 text-sm text-textPrimary outline-none"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(168,85,247,0.2)" }}
              />
            </div>

            {/* Token list */}
            <ul className="max-h-52 space-y-1 overflow-y-auto">
              {filtered.map(token => (
                <li key={token.symbol}>
                  <button
                    type="button"
                    onClick={() => { onSelect(token); setOpen(false); setQuery(""); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                    style={{
                      background: token.symbol === selected.symbol ? "rgba(168,85,247,0.15)" : "transparent",
                      border: token.symbol === selected.symbol ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent"
                    }}
                    onMouseEnter={e => { if (token.symbol !== selected.symbol) (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.08)"; }}
                    onMouseLeave={e => { if (token.symbol !== selected.symbol) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <Image src={token.icon} alt={token.symbol} width={28} height={28} className="rounded-full" />
                    <div>
                      <p className="text-sm font-semibold text-textPrimary">{token.symbol}</p>
                      <p className="text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>{token.name}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
