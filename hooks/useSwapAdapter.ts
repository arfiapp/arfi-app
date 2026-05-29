"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { getEip1193Provider } from "@/lib/wallet-provider";
import type { EIP1193Provider } from "viem";

export function useSwapAdapter() {
  const { isConnected, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [provider, setProvider] = useState<EIP1193Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) {
      setProvider(null);
      setError(null);
      return;
    }
    try {
      setError(null);
      const eip1193 = await getEip1193Provider(connector, walletClient);
      setProvider(eip1193);
    } catch (e) {
      setProvider(null);
      setError(e instanceof Error ? e.message : "Failed to get wallet provider");
    }
  }, [connector, walletClient, isConnected]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { provider, error, refresh, isReady: Boolean(provider) };
}
