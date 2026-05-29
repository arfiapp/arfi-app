"use client";

import { erc20Abi } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { arcTestnet } from "@/lib/arc-chain";
import type { TokenInfo } from "@/lib/tokens";
import { formatTokenAmount } from "@/lib/format";
import { maxSwappableAmount } from "@/lib/gas-reserve";

export function useTokenBalance(token: TokenInfo | undefined) {
  const { address, isConnected } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: token?.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: {
      enabled: Boolean(isConnected && address && token)
    }
  });

  const { data: nativeUsdc } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: {
      enabled: Boolean(isConnected && address && token?.symbol === "USDC")
    }
  });

  let balance = typeof data === "bigint" ? data : 0n;

  // Arc: native USDC (18 decimals) and ERC-20 interface (6 decimals) share the same balance
  if (token?.symbol === "USDC" && nativeUsdc?.value) {
    const nativeAs6 = nativeUsdc.value / 10n ** 12n;
    if (nativeAs6 > balance) balance = nativeAs6;
  }

  const swappable = token ? maxSwappableAmount(balance, token.symbol) : 0n;
  const formatted =
    token && balance > 0n ? formatTokenAmount(balance, token.decimals) : "0";

  return {
    balance,
    swappable,
    formatted,
    isLoading,
    refetch
  };
}
