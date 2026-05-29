"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { sendTokens, type SendResult } from "@/lib/send";
import type { PortfolioToken } from "@/lib/portfolio-tokens";
import type { EIP1193Provider } from "viem";

export type SendStatus = "idle" | "loading" | "success" | "error";

export function useSend() {
  const [status, setStatus]   = useState<SendStatus>("idle");
  const [txHash, setTxHash]   = useState<string | undefined>();
  const [message, setMessage] = useState("");

  const send = useCallback(async (params: {
    provider: EIP1193Provider;
    from: `0x${string}`;
    to: `0x${string}`;
    token: PortfolioToken;
    amount: string;
  }) => {
    setStatus("loading");
    setMessage("Confirm the transaction in MetaMask…");
    setTxHash(undefined);

    const toastId = toast.loading("Sending…");

    try {
      const result: SendResult = await sendTokens(params);

      setStatus("success");
      setTxHash(result.txHash);
      setMessage(`Sent ${result.amount} ${result.symbol} successfully.`);
      toast.success(`Sent ${result.amount} ${result.symbol}!`, { id: toastId, duration: 5000 });

      return result;
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Send failed.";
      // Clean up common viem/MetaMask noise
      const msg = raw.includes("User rejected") || raw.includes("user rejected")
        ? "Transaction cancelled."
        : raw.length > 120 ? raw.slice(0, 120) + "…" : raw;

      setStatus("error");
      setMessage(msg);
      toast.error(msg.slice(0, 80), { id: toastId });
      throw e;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(undefined);
    setMessage("");
  }, []);

  return { status, txHash, message, send, reset };
}
