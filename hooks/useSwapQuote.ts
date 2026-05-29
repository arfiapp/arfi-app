"use client";

import { useEffect, useRef, useState } from "react";
import { estimateSwap } from "@/lib/swap";
import { toUserMessage } from "@/lib/errors";
import type { SwapTokenSymbol } from "@/lib/tokens";
import type { EIP1193Provider } from "viem";

type Params = {
  provider: EIP1193Provider | null;
  address: `0x${string}` | undefined;
  tokenIn: SwapTokenSymbol;
  tokenOut: SwapTokenSymbol;
  amountIn: string;
  slippageBps: number;
  enabled: boolean;
};

export function useSwapQuote({
  provider,
  address,
  tokenIn,
  tokenOut,
  amountIn,
  slippageBps,
  enabled
}: Params) {
  const [amountOut, setAmountOut] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!enabled || !provider || !address || !amountIn || Number(amountIn) <= 0) {
      setAmountOut("");
      setRate("");
      setError(null);
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const estimate = await estimateSwap({
          provider,
          address,
          tokenIn,
          tokenOut,
          amountIn,
          slippageBps
        });

        if (id !== requestId.current) return;

        setAmountOut(estimate.amountOut);

        const inNum = Number(amountIn);
        const outNum = Number(estimate.amountOut);
        if (inNum > 0 && outNum > 0) {
          const impact = estimate.priceImpactBps / 100;
          setRate(
            `1 ${tokenIn} ≈ ${(outNum / inNum).toFixed(4)} ${tokenOut}` +
            (impact > 0 ? ` (${impact.toFixed(2)}% impact)` : "")
          );
        } else {
          setRate("");
        }
      } catch (e) {
        if (id !== requestId.current) return;
        setAmountOut("");
        setRate("");
        setError(toUserMessage(e));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [provider, address, tokenIn, tokenOut, amountIn, slippageBps, enabled]);

  return { amountOut, rate, loading, error };
}
