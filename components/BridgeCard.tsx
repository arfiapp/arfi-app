"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUpDown, Shield, Globe, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { CCTP_CHAINS, type CctpChain } from "@/lib/cctp-chains";
import { getUsdcBalance } from "@/lib/bridge";
import { getEip1193Provider } from "@/lib/wallet-provider";
import { useSwapAdapter } from "@/hooks/useSwapAdapter";
import { useBridge } from "@/hooks/useBridge";
import { sanitizeAmountInput } from "@/lib/format";
import { ChainSelector } from "./ChainSelector";

const ARC_CHAIN = CCTP_CHAINS.find(c => c.id === 5042002)!;

export function BridgeCard() {
  const { isConnected, address, connector } = useAccount();
  const { data: walletClient } = (useAccount() as any);
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { provider } = useSwapAdapter();
  const { status, message, burnTxHash, mintTxHash, bridge, reset } = useBridge();

  const [fromChain, setFromChain] = useState<CctpChain>(ARC_CHAIN);
  const [toChain, setToChain]     = useState<CctpChain>(CCTP_CHAINS[1]); // Sepolia
  const [amount, setAmount]       = useState("");
  const [balance, setBalance]     = useState<string>("0");
  const [loadingBal, setLoadingBal] = useState(false);

  // Fetch USDC balance on fromChain
  const fetchBalance = useCallback(async () => {
    if (!address) return;
    setLoadingBal(true);
    try {
      const bal = await getUsdcBalance(fromChain, address);
      setBalance(bal);
    } catch { setBalance("—"); }
    finally { setLoadingBal(false); }
  }, [address, fromChain]);

  useEffect(() => { void fetchBalance(); }, [fetchBalance]);

  const flipChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
    setAmount("");
    reset();
  };

  const handleMax = () => {
    if (balance && balance !== "—") setAmount(balance);
  };

  const handleBridge = async () => {
    if (!provider || !address || !amount || Number(amount) <= 0) return;

    // If wallet is on wrong chain, ask to switch
    if (chainId !== fromChain.id) {
      try { switchChain({ chainId: fromChain.id }); } catch { /* ignore */ }
      return;
    }

    try {
      await bridge({ provider, address, sourceChain: fromChain, destChain: toChain, amount });
      setAmount("");
      void fetchBalance();
    } catch { /* handled in hook */ }
  };

  const isLoading = ["approving","burning","attesting","minting"].includes(status);
  const wrongChain = isConnected && chainId !== fromChain.id;

  const btnLabel = () => {
    if (!isConnected) return "Connect Wallet";
    if (wrongChain) return `Switch to ${fromChain.shortName}`;
    if (status === "approving") return "Approving…";
    if (status === "burning")   return "Burning USDC…";
    if (status === "attesting") return "Waiting for attestation…";
    if (status === "minting")   return "Minting USDC…";
    return "Bridge USDC";
  };

  const btnDisabled =
    !isConnected ||
    isLoading ||
    (!wrongChain && (!amount || Number(amount) <= 0));

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="glass-card p-5">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400" style={{ boxShadow: "0 0 6px #a855f7" }} />
            <span className="font-display text-base font-bold text-textPrimary">Bridge</span>
          </div>
          <span className="text-xs" style={{ color: "rgba(192,132,252,0.45)" }}>
            Powered by Circle CCTP V2
          </span>
        </div>

        {/* FROM field */}
        <div className="swap-field mb-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(192,132,252,0.5)" }}>From</span>
            <span className="text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>
              USDC Balance:{" "}
              <span className="font-semibold text-textPrimary">
                {loadingBal ? "…" : balance}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={e => { setAmount(sanitizeAmountInput(e.target.value)); reset(); }}
                className="bg-transparent text-2xl font-semibold text-textPrimary outline-none placeholder:opacity-30"
              />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <ChainSelector
                chains={CCTP_CHAINS}
                selected={fromChain}
                onSelect={c => { setFromChain(c); reset(); }}
                exclude={toChain.id}
              />
              <button
                type="button"
                onClick={handleMax}
                className="rounded-md px-2 py-0.5 text-xs font-bold transition"
                style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        {/* Flip button */}
        <div className="flex justify-center py-1">
          <button
            type="button"
            onClick={flipChains}
            className="swap-flip-btn"
            aria-label="Flip chains"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        {/* TO field */}
        <div className="swap-field mt-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(192,132,252,0.5)" }}>To</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-2xl font-semibold" style={{ color: "rgba(192,132,252,0.4)" }}>$</span>
              <span className="text-2xl font-semibold text-textPrimary">
                {amount || <span className="opacity-30">0.00</span>}
              </span>
              <span className="text-sm font-medium" style={{ color: "rgba(192,132,252,0.6)" }}>USDC</span>
            </div>
            <ChainSelector
              chains={CCTP_CHAINS}
              selected={toChain}
              onSelect={c => { setToChain(c); reset(); }}
              exclude={fromChain.id}
            />
          </div>
        </div>

        {/* Info box */}
        <div className="mt-3 flex gap-2.5 rounded-xl p-3"
          style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)" }}>
          <Shield className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "rgba(168,85,247,0.6)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "rgba(192,132,252,0.6)" }}>
            Arc uses USDC as its native gas token. The bridge uses Arc&apos;s ERC-20
            interface to burn USDC for cross-chain transfer via Circle CCTP V2.
            1:1 native USDC — no wrapped tokens.
          </p>
        </div>

        {/* Status message */}
        {isLoading && (
          <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: "#a855f7" }} />
            <p className="text-xs text-textSecondary">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-3 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
              <p className="text-xs font-semibold text-green-400">Bridge complete!</p>
            </div>
            <div className="space-y-1">
              {burnTxHash && (
                <a
                  href={`${fromChain.explorerUrl}/tx/${burnTxHash}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs hover:text-purple-300 transition"
                  style={{ color: "rgba(192,132,252,0.6)" }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Burn tx on {fromChain.shortName}
                </a>
              )}
              {mintTxHash && (
                <a
                  href={`${toChain.explorerUrl}/tx/${mintTxHash}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs hover:text-purple-300 transition"
                  style={{ color: "rgba(192,132,252,0.6)" }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Mint tx on {toChain.shortName}
                </a>
              )}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mt-3 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-xs text-red-400">{message}</p>
          </div>
        )}

        {wrongChain && (
          <div className="mt-3 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p className="text-xs text-amber-300">
              Switch your wallet to <strong>{fromChain.name}</strong> to bridge from this chain.
            </p>
          </div>
        )}

        {/* Bridge button */}
        <button
          type="button"
          onClick={() => void handleBridge()}
          disabled={btnDisabled}
          className="swap-cta mt-4 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Globe className="h-4 w-4" />
          {btnLabel()}
        </button>
      </div>

      {/* Info cards */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <Shield className="mb-2 h-5 w-5" style={{ color: "rgba(168,85,247,0.7)" }} />
          <p className="text-sm font-semibold text-textPrimary">Secure</p>
          <p className="mt-1 text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>
            Native burn &amp; mint. No wrapped tokens.
          </p>
        </div>
        <div className="glass-card p-4">
          <Globe className="mb-2 h-5 w-5" style={{ color: "rgba(168,85,247,0.7)" }} />
          <p className="text-sm font-semibold text-textPrimary">{CCTP_CHAINS.length} Chains</p>
          <p className="mt-1 text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>
            Testnet chains supported via CCTP.
          </p>
        </div>
      </div>
    </div>
  );
}
