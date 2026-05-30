"use client";

import { motion } from "framer-motion";
import { ArrowUpDown, Settings, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "@/lib/arc-chain";
import { ensureArcChain } from "@/lib/ensure-arc-chain";
import { sanitizeAmountInput, parseTokenAmount, formatAmountForInput } from "@/lib/format";
import { getToken, type SwapTokenSymbol } from "@/lib/tokens";
import { useSwap } from "@/hooks/useSwap";
import { useSwapAdapter } from "@/hooks/useSwapAdapter";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useNativeGasBalance } from "@/hooks/useNativeGasBalance";
import { SlippageModal } from "./SlippageModal";
import { TokenSelector } from "./TokenSelector";

const PERCENTS = [25, 50, 75, 100] as const;

export function SwapCard() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { provider, isReady, error: adapterError } = useSwapAdapter();
  const wrongChain = isConnected && chainId !== arcTestnet.id;
  const { status, txHash, message, swap, reset } = useSwap();

  const [tokenInSymbol, setTokenInSymbol]   = useState<SwapTokenSymbol>("USDC");
  const [tokenOutSymbol, setTokenOutSymbol] = useState<SwapTokenSymbol>("EURC");
  const [amountIn, setAmountIn]             = useState("");
  const [slippageBps, setSlippageBps]       = useState(100);
  const [slippageOpen, setSlippageOpen]     = useState(false);
  const [flipped, setFlipped]               = useState(false);

  const tokenIn  = getToken(tokenInSymbol);
  const tokenOut = getToken(tokenOutSymbol);

  const { balance: sellBalance, swappable: sellSwappable, formatted: sellFormatted, refetch: refetchBalance } = useTokenBalance(tokenIn);
  const { balance: buyBalance, formatted: buyFormatted } = useTokenBalance(tokenOut);
  const { hasEnoughForGas } = useNativeGasBalance();

  const quoteEnabled = isConnected && isReady && Boolean(address) && Boolean(amountIn) && Number(amountIn) > 0;

  const { amountOut, rate, loading: quoteLoading, error: quoteError } = useSwapQuote({
    provider, address, tokenIn: tokenInSymbol, tokenOut: tokenOutSymbol,
    amountIn, slippageBps, enabled: quoteEnabled
  });

  const flipTokens = useCallback(() => {
    setFlipped(f => !f);
    setTokenInSymbol(tokenOutSymbol);
    setTokenOutSymbol(tokenInSymbol);
    setAmountIn(amountOut || "");
    reset();
  }, [tokenInSymbol, tokenOutSymbol, amountOut, reset]);

  const applyPercent = (pct: number) => {
    if (sellSwappable === 0n) return;
    const portion = pct === 100 ? sellSwappable : (sellSwappable * BigInt(pct)) / 100n;
    setAmountIn(formatAmountForInput(portion, tokenIn.decimals));
    reset();
  };

  const handleSwap = async () => {
    if (!provider || !address || !amountIn || Number(amountIn) <= 0) return;
    try {
      await ensureArcChain();
      await swap({ provider, address, tokenIn: tokenInSymbol, tokenOut: tokenOutSymbol, amountIn, slippageBps });
      setAmountIn("");
      void refetchBalance();
    } catch { /* handled in hook */ }
  };

  const swapDisabled = useMemo(() => {
    if (!isConnected || !isReady || wrongChain) return true;
    if (!amountIn || Number(amountIn) <= 0) return true;
    if (status === "loading") return true;
    try {
      if (parseTokenAmount(amountIn, tokenIn.decimals) > sellSwappable) return true;
      if (!hasEnoughForGas) return true;
    } catch { return true; }
    return false;
  }, [amountIn, isConnected, isReady, wrongChain, sellSwappable, hasEnoughForGas, status, tokenIn.decimals]);

  return (
    <div className="w-full max-w-sm sm:max-w-sm">
      <div className="glass-card p-4 sm:p-5">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base sm:text-lg font-bold text-textPrimary">Swap</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { reset(); void refetchBalance(); }}
              className="rounded-lg p-1.5 transition hover:bg-white/5"
              style={{ color: "rgba(192,132,252,0.5)" }}
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSlippageOpen(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition hover:bg-white/5"
              style={{ color: "rgba(192,132,252,0.5)" }}
            >
              <Settings className="h-3.5 w-3.5" />
              {(slippageBps / 100).toFixed(1)}%
            </button>
          </div>
        </div>

        {/* Sell field */}
        <div className="swap-field mb-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "rgba(192,132,252,0.5)" }}>Sell</span>
            {isConnected && (
              <button
                type="button"
                onClick={() => applyPercent(100)}
                className="text-xs transition hover:text-purple-300"
                style={{ color: "rgba(192,132,252,0.5)" }}
              >
                Balance&nbsp;{sellFormatted}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amountIn}
              onChange={e => { setAmountIn(sanitizeAmountInput(e.target.value)); reset(); }}
              className="min-w-0 flex-1 bg-transparent text-xl sm:text-2xl font-semibold text-textPrimary outline-none placeholder:opacity-30"
            />
            <TokenSelector
              selected={tokenIn}
              onSelect={t => {
                if (t.symbol === tokenOutSymbol) setTokenOutSymbol(tokenInSymbol);
                setTokenInSymbol(t.symbol); reset();
              }}
            />
          </div>
        </div>

        {/* Percent buttons */}
        <div className="flex gap-1.5 px-1 py-1.5">
          {PERCENTS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => applyPercent(p)}
              disabled={!isConnected || sellSwappable === 0n}
              className="pct-btn flex-1"
            >
              {p === 100 ? "Max" : `${p}%`}
            </button>
          ))}
        </div>

        {/* Flip button */}
        <div className="flex justify-center py-1">
          <motion.button
            type="button"
            onClick={flipTokens}
            animate={{ rotate: flipped ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="swap-flip-btn"
            aria-label="Flip tokens"
          >
            <ArrowUpDown className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Buy field */}
        <div className="swap-field mt-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "rgba(192,132,252,0.5)" }}>Buy</span>
            {isConnected && (
              <span className="text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>
                Balance&nbsp;{buyFormatted}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 text-xl sm:text-2xl font-semibold text-textPrimary">
              {quoteLoading ? (
                <span className="animate-pulse opacity-50">…</span>
              ) : (
                amountOut || <span className="opacity-30">0</span>
              )}
            </div>
            <TokenSelector
              selected={tokenOut}
              onSelect={t => {
                if (t.symbol === tokenInSymbol) setTokenInSymbol(tokenOutSymbol);
                setTokenOutSymbol(t.symbol); reset();
              }}
            />
          </div>
        </div>

        {/* Rate row */}
        {rate && !quoteLoading && (
          <div className="mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs"
            style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.1)" }}>
            <div className="flex items-center gap-1.5" style={{ color: "rgba(192,132,252,0.7)" }}>
              <Image src={tokenIn.icon} alt={tokenIn.symbol} width={14} height={14} />
              <span>1 {tokenIn.symbol}</span>
              <span>=</span>
              <Image src={tokenOut.icon} alt={tokenOut.symbol} width={14} height={14} />
              <span className="text-textPrimary font-medium">
                {amountOut && amountIn && Number(amountIn) > 0
                  ? (Number(amountOut) / Number(amountIn)).toFixed(4)
                  : "—"} {tokenOut.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Warnings */}
        <div className="mt-3 space-y-2">
          {quoteError && (
            <p className="rounded-lg px-3 py-2 text-xs text-red-300"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {quoteError}
            </p>
          )}
          {wrongChain && (
            <p className="rounded-lg px-3 py-2 text-xs text-amber-300"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              Switch to Arc Testnet (5042002) to swap.
            </p>
          )}
          {adapterError && (
            <p className="rounded-lg px-3 py-2 text-xs text-red-300"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {adapterError}
            </p>
          )}
          {isConnected && !hasEnoughForGas && (
            <p className="rounded-lg px-3 py-2 text-xs text-amber-300"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              Need ~0.1 USDC for gas.{" "}
              <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="underline">Faucet</a>
            </p>
          )}
          {isConnected && sellBalance === 0n && (
            <p className="rounded-lg px-3 py-2 text-xs"
              style={{ color: "rgba(192,132,252,0.6)", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)" }}>
              No {tokenIn.symbol} balance.{" "}
              <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="underline hover:text-purple-300">Get test tokens</a>
            </p>
          )}
        </div>

        {/* Swap / Connect button */}
        {!isConnected ? (
          <ConnectButton.Custom>
            {({ openConnectModal, mounted }) =>
              mounted ? (
                <button
                  type="button"
                  onClick={openConnectModal}
                  className="swap-cta mt-4"
                >
                  Connect Wallet
                </button>
              ) : null
            }
          </ConnectButton.Custom>
        ) : (
          <button
            type="button"
            onClick={() => void handleSwap()}
            disabled={swapDisabled}
            className="swap-cta mt-4"
          >
            {status === "loading" ? "Swapping…" : "Swap"}
          </button>
        )}

        {/* Status message */}
        {status !== "idle" && message && (
          <p className={`mt-3 text-center text-xs ${
            status === "error" ? "text-red-400" : status === "success" ? "text-purple-300" : "text-textSecondary"
          }`}>
            {message}
            {txHash && (
              <>
                {" "}
                <a
                  href={`https://testnet.arcscan.app/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  View on ArcScan
                </a>
              </>
            )}
          </p>
        )}
      </div>

      <SlippageModal
        open={slippageOpen}
        slippageBps={slippageBps}
        onClose={() => setSlippageOpen(false)}
        onChange={setSlippageBps}
      />
    </div>
  );
}
