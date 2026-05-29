"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { ChevronDown, X, Search, CheckCircle2, ExternalLink, Loader2, Send } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PORTFOLIO_TOKENS, type PortfolioToken } from "@/lib/portfolio-tokens";
import { validateAddress } from "@/lib/send";
import { sanitizeAmountInput, parseTokenAmount, formatAmountForInput } from "@/lib/format";
import { useSwapAdapter } from "@/hooks/useSwapAdapter";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useSend } from "@/hooks/useSend";
import { arcTxUrl } from "@/lib/arc-chain";

// ── Token picker modal ────────────────────────────────────────────────────────

function TokenPicker({
  selected,
  onSelect,
  onClose,
}: {
  selected: PortfolioToken;
  onSelect: (t: PortfolioToken) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? PORTFOLIO_TOKENS.filter(t => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
      : PORTFOLIO_TOKENS;
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="glass-card w-full max-w-xs p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-textPrimary">Select token</h3>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1 transition hover:bg-white/5"
            style={{ color: "rgba(192,132,252,0.5)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: "rgba(192,132,252,0.4)" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-xl py-2 pl-8 pr-3 text-sm text-textPrimary outline-none"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(168,85,247,0.2)" }}
          />
        </div>

        <ul className="max-h-52 space-y-1 overflow-y-auto">
          {filtered.map(token => (
            <li key={token.symbol}>
              <button
                type="button"
                onClick={() => { onSelect(token); onClose(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                style={{
                  background: token.symbol === selected.symbol ? "rgba(168,85,247,0.15)" : "transparent",
                  border: token.symbol === selected.symbol ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
                }}
              >
                {token.icon ? (
                  <Image src={token.icon} alt={token.symbol} width={28} height={28} className="rounded-full" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: `${token.color}25`, color: token.color }}>
                    {token.symbol[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-textPrimary">{token.symbol}</p>
                  <p className="text-xs" style={{ color: "rgba(192,132,252,0.45)" }}>{token.name}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Token balance hook adapter ────────────────────────────────────────────────
// useTokenBalance expects TokenInfo shape — PortfolioToken is compatible
// except it lacks `swappable`. We cast it safely.
function usePortfolioTokenBalance(token: PortfolioToken) {
  const adapted = { ...token, swappable: true } as Parameters<typeof useTokenBalance>[0];
  return useTokenBalance(adapted);
}

// ── Main SendCard ─────────────────────────────────────────────────────────────

export function SendCard() {
  const { isConnected, address } = useAccount();
  const { provider } = useSwapAdapter();
  const { status, txHash, message, send, reset } = useSend();

  const [token, setToken]         = useState<PortfolioToken>(PORTFOLIO_TOKENS[0]);
  const [amount, setAmount]       = useState("");
  const [recipient, setRecipient] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const { balance: rawBalance, formatted: balanceFormatted, refetch } = usePortfolioTokenBalance(token);

  const recipientValid = recipient.length > 0 && validateAddress(recipient);
  const recipientError = recipient.length > 0 && !recipientValid;

  const amountNum = Number(amount);
  const amountWei = amount ? (() => {
    try { return parseTokenAmount(amount, token.decimals); } catch { return 0n; }
  })() : 0n;

  const insufficientBalance = amountWei > 0n && amountWei > rawBalance;

  const canSend =
    isConnected &&
    provider &&
    address &&
    recipientValid &&
    amountNum > 0 &&
    !insufficientBalance &&
    status !== "loading";

  const handleMax = () => {
    if (rawBalance > 0n) {
      setAmount(formatAmountForInput(rawBalance, token.decimals));
      reset();
    }
  };

  const handleSend = async () => {
    if (!canSend || !provider || !address) return;
    try {
      await send({
        provider,
        from: address,
        to: recipient as `0x${string}`,
        token,
        amount,
      });
      setAmount("");
      setRecipient("");
      void refetch();
    } catch { /* handled in hook */ }
  };

  return (
    <>
      {pickerOpen && (
        <TokenPicker
          selected={token}
          onSelect={t => { setToken(t); setAmount(""); reset(); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div className="w-full max-w-md">
        <div className="glass-card p-6">

          {/* Header */}
          <div className="mb-5">
            <h2 className="font-display text-xl font-bold text-textPrimary">Transfer tokens</h2>
            <p className="mt-1 text-sm" style={{ color: "rgba(192,132,252,0.5)" }}>
              Send any ERC-20 token to a wallet address
            </p>
          </div>

          <div className="space-y-3">
            {/* Token + amount field */}
            <div className="swap-field">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "rgba(192,132,252,0.5)" }}>Token</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>
                    Balance:{" "}
                    <span className="font-semibold text-textPrimary">{balanceFormatted}</span>
                  </span>
                  {rawBalance > 0n && (
                    <button
                      type="button"
                      onClick={handleMax}
                      className="rounded px-1.5 py-0.5 text-xs font-bold transition"
                      style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc" }}
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Token selector button */}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="token-btn shrink-0"
                >
                  {token.icon ? (
                    <Image src={token.icon} alt={token.symbol} width={18} height={18} className="rounded-full" />
                  ) : (
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: `${token.color}30`, color: token.color }}>
                      {token.symbol[0]}
                    </span>
                  )}
                  <span>{token.symbol}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>

                {/* Amount input */}
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => { setAmount(sanitizeAmountInput(e.target.value)); reset(); }}
                  className="min-w-0 flex-1 bg-transparent text-right text-2xl font-semibold text-textPrimary outline-none placeholder:opacity-30"
                />
              </div>

              {insufficientBalance && (
                <p className="mt-1.5 text-xs text-red-400">Insufficient balance</p>
              )}
            </div>

            {/* Recipient address field */}
            <div className="swap-field">
              <label className="mb-2 block text-xs font-medium" style={{ color: "rgba(192,132,252,0.5)" }}>
                Recipient Address
              </label>
              <input
                type="text"
                placeholder="0x…"
                value={recipient}
                onChange={e => { setRecipient(e.target.value.trim()); reset(); }}
                spellCheck={false}
                className="w-full bg-transparent text-sm font-mono text-textPrimary outline-none placeholder:opacity-30"
                style={{ color: recipientError ? "#f87171" : undefined }}
              />
              {recipientError && (
                <p className="mt-1.5 text-xs text-red-400">Invalid Ethereum address</p>
              )}
            </div>

            {/* Status messages */}
            {status === "loading" && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: "#a855f7" }} />
                <p className="text-xs text-textSecondary">{message}</p>
              </div>
            )}

            {status === "success" && (
              <div className="rounded-xl px-3 py-2.5"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                  <p className="text-xs font-semibold text-green-400">{message}</p>
                </div>
                {txHash && (
                  <a
                    href={arcTxUrl(txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 flex items-center gap-1 text-xs transition hover:text-purple-300"
                    style={{ color: "rgba(192,132,252,0.6)" }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on ArcScan
                  </a>
                )}
              </div>
            )}

            {status === "error" && (
              <div className="rounded-xl px-3 py-2.5"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p className="text-xs text-red-400">{message}</p>
              </div>
            )}

            {/* CTA button */}
            {!isConnected ? (
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) =>
                  mounted ? (
                    <button
                      type="button"
                      onClick={openConnectModal}
                      className="swap-cta flex items-center justify-center gap-2"
                    >
                      Connect Wallet
                    </button>
                  ) : null
                }
              </ConnectButton.Custom>
            ) : (
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!canSend}
                className="swap-cta flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {status === "loading" ? "Sending…" : "Send"}
              </button>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs"
          style={{ color: "rgba(192,132,252,0.3)" }}>
          <span>Transfers on</span>
          <a
            href="https://testnet.arcscan.app"
            target="_blank"
            rel="noreferrer"
            className="hover:text-purple-300 transition-colors"
          >
            Arc Testnet
          </a>
          <span>·</span>
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-purple-300 transition-colors"
          >
            Get test tokens
          </a>
        </div>
      </div>
    </>
  );
}
