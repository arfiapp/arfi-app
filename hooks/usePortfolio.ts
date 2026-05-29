"use client";

import { erc20Abi, formatUnits } from "viem";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { arcTestnet } from "@/lib/arc-chain";
import { PORTFOLIO_TOKENS, type PortfolioToken } from "@/lib/portfolio-tokens";

export type TokenHolding = {
  token: PortfolioToken;
  rawBalance: bigint;
  balance: number;       // human-readable float
  usdValue: number;
  pct: number;           // allocation percentage 0-100
};

export function usePortfolio() {
  const { address, isConnected } = useAccount();

  // Batch all ERC-20 balanceOf calls
  const { data: balances, isLoading, refetch } = useReadContracts({
    contracts: PORTFOLIO_TOKENS.map(t => ({
      address: t.address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address ?? "0x0000000000000000000000000000000000000000"] as [`0x${string}`],
      chainId: arcTestnet.id,
    })),
    query: { enabled: Boolean(isConnected && address) },
  });

  // Native USDC balance (18 decimals) for cross-check
  const { data: nativeUsdc } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: { enabled: Boolean(isConnected && address) },
  });

  const holdings: TokenHolding[] = PORTFOLIO_TOKENS.map((token, i) => {
    let rawBalance = 0n;

    const result = balances?.[i];
    if (result?.status === "success" && typeof result.result === "bigint") {
      rawBalance = result.result;
    }

    // For USDC: use native balance if larger (Arc native USDC = 18 dec, ERC-20 = 6 dec)
    if (token.symbol === "USDC" && nativeUsdc?.value) {
      const nativeAs6 = nativeUsdc.value / 10n ** 12n;
      if (nativeAs6 > rawBalance) rawBalance = nativeAs6;
    }

    const balance  = Number(formatUnits(rawBalance, token.decimals));
    const usdValue = balance * token.usdPrice;

    return { token, rawBalance, balance, usdValue, pct: 0 };
  });

  // Compute allocation percentages
  const totalUsd = holdings.reduce((s, h) => s + h.usdValue, 0);
  holdings.forEach(h => {
    h.pct = totalUsd > 0 ? (h.usdValue / totalUsd) * 100 : 0;
  });

  const nonZeroCount = holdings.filter(h => h.balance > 0).length;

  return { holdings, totalUsd, nonZeroCount, isLoading, refetch };
}
