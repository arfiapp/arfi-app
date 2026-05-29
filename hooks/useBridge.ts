"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { executeBridge, type BridgeStatus, type BridgeResult } from "@/lib/bridge";
import type { CctpChain } from "@/lib/cctp-chains";
import type { EIP1193Provider } from "viem";

export type BridgeState = {
  status: BridgeStatus;
  message: string;
  burnTxHash?: string;
  mintTxHash?: string;
};

export function useBridge() {
  const [state, setState] = useState<BridgeState>({
    status: "idle",
    message: "",
  });

  const bridge = useCallback(async (params: {
    provider: EIP1193Provider;
    address: `0x${string}`;
    sourceChain: CctpChain;
    destChain: CctpChain;
    amount: string;
  }) => {
    const toastId = toast.loading("Starting bridge…");

    setState({ status: "approving", message: "Preparing bridge…" });

    try {
      const result: BridgeResult = await executeBridge(
        params,
        (status, message) => {
          setState(prev => ({ ...prev, status, message }));
          toast.loading(message, { id: toastId });
        }
      );

      setState({
        status: "success",
        message: `Bridge complete! ${result.amount} USDC transferred.`,
        burnTxHash: result.burnTxHash,
        mintTxHash: result.mintTxHash,
      });

      toast.success("Bridge complete!", { id: toastId, duration: 6000 });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bridge failed.";
      setState({ status: "error", message: msg });
      toast.error(msg.slice(0, 80), { id: toastId });
      throw e;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", message: "" });
  }, []);

  return { ...state, bridge, reset };
}
