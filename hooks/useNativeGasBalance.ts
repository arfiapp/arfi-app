"use client";

import { useAccount, useBalance } from "wagmi";
import { arcTestnet } from "@/lib/arc-chain";
import { formatTokenAmount } from "@/lib/format";
import { MIN_NATIVE_USDC_FOR_GAS } from "@/lib/gas-reserve";

/** Arc native gas token = USDC (18 decimals) */
export function useNativeGasBalance() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, refetch } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: { enabled: Boolean(isConnected && address) }
  });

  const balance = data?.value ?? 0n;
  const hasEnoughForGas = balance >= MIN_NATIVE_USDC_FOR_GAS;
  const formatted =
    balance > 0n ? formatTokenAmount(balance, 18, 4) : "0";

  return { balance, formatted, hasEnoughForGas, isLoading, refetch };
}
