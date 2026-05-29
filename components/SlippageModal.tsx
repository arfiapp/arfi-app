"use client";

import { X } from "lucide-react";

const PRESETS = [50, 100, 200];

type Props = {
  open: boolean;
  slippageBps: number;
  onClose: () => void;
  onChange: (bps: number) => void;
};

export function SlippageModal({ open, slippageBps, onClose, onChange }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-xs p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-textPrimary">Slippage tolerance</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition hover:bg-white/5"
            style={{ color: "rgba(192,132,252,0.5)" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {PRESETS.map(bps => (
            <button
              key={bps}
              type="button"
              onClick={() => onChange(bps)}
              className="flex-1 rounded-xl py-2 text-sm font-medium transition"
              style={
                slippageBps === bps
                  ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", boxShadow: "0 0 16px rgba(168,85,247,0.4)" }
                  : { background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)", color: "rgba(192,132,252,0.7)" }
              }
            >
              {(bps / 100).toFixed(1)}%
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>Custom (%)</label>
        <input
          type="number"
          min={0.1}
          max={50}
          step={0.1}
          value={slippageBps / 100}
          onChange={e => {
            const val = Number(e.target.value);
            if (!Number.isFinite(val) || val <= 0) return;
            onChange(Math.round(val * 100));
          }}
          className="w-full rounded-xl px-3 py-2 text-sm text-textPrimary outline-none"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(168,85,247,0.2)" }}
        />
      </div>
    </div>
  );
}
