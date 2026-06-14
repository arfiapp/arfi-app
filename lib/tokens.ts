/**
 * Arc Testnet token definitions.
 * Sources:
 *   https://docs.arc.network/arc/references/contract-addresses
 *   https://developers.circle.com/assets/cirbtc-contract-addresses
 */

export type SwapTokenSymbol = "USDC" | "EURC" | "cirBTC";

export type TokenInfo = {
  symbol: SwapTokenSymbol;
  name: string;
  address: `0x${string}`;
  decimals: number;
  icon: string;
  /** Supported for swap on Arc Testnet */
  swappable: boolean;
  /**
   * Approximate USD price for display purposes only.
   * USDC/EURC are pegged; cirBTC uses a fixed BTC approximation.
   */
  usdPrice: number;
};

export const TOKENS: TokenInfo[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
    icon: "/icons/usdc.svg",
    swappable: true,
    usdPrice: 1.0,
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
    icon: "/icons/eurc.svg",
    swappable: true,
    usdPrice: 1.09,
  },
  {
    symbol: "cirBTC",
    name: "Circle Wrapped Bitcoin",
    address: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
    decimals: 8,
    icon: "/icons/cirbtc.svg",
    swappable: true,
    usdPrice: 105_000,
  },
];

export function getToken(symbol: SwapTokenSymbol): TokenInfo {
  const token = TOKENS.find((t) => t.symbol === symbol);
  if (!token) throw new Error(`Unknown token: ${symbol}`);
  return token;
}

/**
 * Returns a sensible opposite token for the flip button.
 * cirBTC ↔ USDC, USDC ↔ EURC, EURC ↔ USDC
 */
export function getOppositeToken(symbol: SwapTokenSymbol): SwapTokenSymbol {
  if (symbol === "cirBTC") return "USDC";
  if (symbol === "USDC")   return "EURC";
  return "USDC";
}
