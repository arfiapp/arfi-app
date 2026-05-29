"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { executeSwap } from "@/lib/swap";
import { toUserMessage } from "@/lib/errors";
import { arcTxUrl } from "@/lib/arc-chain";
import type { SwapTokenSymbol } from "@/lib/tokens";
import type { EIP1193Provider } from "viem";

export type SwapStatus = "idle" | "loading" | "success" | "error";

export function useSwap() {
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [txHash, setTxHash] = useState<string | undefined>();
  const [message, setMessage] = useState<string>("");

  const swap = useCallback(
    async (params: {
      provider: EIP1193Provider;
      address: `0x${string}`;
      tokenIn: SwapTokenSymbol;
      tokenOut: SwapTokenSymbol;
      amountIn: string;
      slippageBps: number;
    }) => {
      setStatus("loading");
      setMessage("Step 1/2: Waiting for token approval in MetaMask...");
      setTxHash(undefined);

      const toastId = toast.loading("Waiting for approval...");

      try {
        const result = await executeSwap(params);
        const hash = result.transactionHash;

        setStatus("success");
        setTxHash(hash);
        setMessage(
          hash
            ? `Swap completed successfully. ArcScan: ${arcTxUrl(hash)}`
            : "Swap completed successfully."
        );
        toast.success("Swap complete!", { id: toastId, duration: 5000 });

        return result;
      } catch (e) {
        console.error("Swap error:", e);
        const msg = toUserMessage(e);
        setStatus("error");
        setMessage(msg);
        toast.error(msg, { id: toastId });
        throw e;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(undefined);
    setMessage("");
  }, []);

  return { status, txHash, message, swap, reset };
}
