/** Arc Testnet — docs.arc.io/arc/references/contract-addresses */
export type SwapTokenSymbol = "USDC" | "EURC" | "cirBTC";

export type TokenInfo = {
  symbol: SwapTokenSymbol;
  name: string;
  address: `0x${string}`;
  decimals: number;
  icon: string;
  /** Supported for swap via XyloRouter on Arc Testnet */
  swappable: boolean;
};

export const TOKENS: TokenInfo[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
    icon: "/icons/usdc.svg",
    swappable: true
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
    icon: "/icons/eurc.svg",
    swappable: true
  },
  {
    symbol: "cirBTC",
    name: "Circle Wrapped Bitcoin",
    address: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
    decimals: 8,
    icon: "/icons/cirbtc.svg",
    swappable: false   // XyloRouter has no cirBTC liquidity pool on Arc Testnet
  }
];

export function getToken(symbol: SwapTokenSymbol): TokenInfo {
  const token = TOKENS.find((t) => t.symbol === symbol);
  if (!token) throw new Error(`Unknown token: ${symbol}`);
  return token;
}

export function getOppositeToken(symbol: SwapTokenSymbol): SwapTokenSymbol {
  return symbol === "USDC" ? "EURC" : "USDC";
}
