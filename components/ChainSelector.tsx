"use client";

import { ChevronDown, X } from "lucide-react";
import { useState } from "react";
import type { CctpChain } from "@/lib/cctp-chains";

type Props = {
  chains: CctpChain[];
  selected: CctpChain;
  onSelect: (chain: CctpChain) => void;
  exclude?: number;
};

export function ChainSelector({ chains, selected, onSelect, exclude }: Props) {
  const [open, setOpen] = useState(false);
  const available = chains.filter(c => c.id !== exclude);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="token-btn shrink-0"
      >
        <span className="text-base leading-none">{selected.icon}</span>
        <span>{selected.shortName}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="glass-card w-full max-w-xs p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-textPrimary">Select chain</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 transition hover:bg-white/5"
                style={{ color: "rgba(192,132,252,0.5)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="space-y-1">
              {available.map(chain => (
                <li key={chain.id}>
                  <button
                    type="button"
                    onClick={() => { onSelect(chain); setOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                    style={{
                      background: chain.id === selected.id ? "rgba(168,85,247,0.15)" : "transparent",
                      border: chain.id === selected.id ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
                    }}
                    onMouseEnter={e => { if (chain.id !== selected.id) (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.08)"; }}
                    onMouseLeave={e => { if (chain.id !== selected.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span className="text-xl">{chain.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-textPrimary">{chain.name}</p>
                      <p className="text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>
                        Domain {chain.domain} · Chain {chain.id}
                      </p>
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
