/** Arc Testnet — docs.arc.io/arc/references/contract-addresses */
export type SwapTokenSymbol = "USDC" | "EURC";

export type TokenInfo = {
  symbol: SwapTokenSymbol;
  name: string;
  address: `0x${string}`;
  decimals: number;
  icon: string;
  /** Supported for swap via Circle App Kit on Arc Testnet */
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
