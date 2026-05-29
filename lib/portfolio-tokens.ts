/**
 * Arc Testnet portfolio tokens
 * Sources:
 *   https://docs.arc.network/arc/references/contract-addresses
 *   https://developers.circle.com/assets/cirbtc-contract-addresses
 */

export type PortfolioToken = {
  symbol: string;
  name: string;
  description: string;
  address: `0x${string}`;
  decimals: number;
  icon: string;        // path or emoji fallback
  color: string;       // for donut chart segment
  /** USD price (testnet approximation) */
  usdPrice: number;
};

export const PORTFOLIO_TOKENS: PortfolioToken[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    description: "Arc gas and payment asset",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
    icon: "/icons/usdc.svg",
    color: "#2775CA",
    usdPrice: 1.0,
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    description: "Euro-denominated stablecoin on Arc",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
    icon: "/icons/eurc.svg",
    color: "#a855f7",
    usdPrice: 1.09,   // approximate EUR/USD
  },
  {
    symbol: "cirBTC",
    name: "Circle Wrapped Bitcoin",
    description: "Circle Wrapped Bitcoin testnet asset on Arc",
    address: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
    decimals: 8,
    icon: "",          // no icon file — use letter avatar
    color: "#f59e0b",
    usdPrice: 105000, // approximate BTC/USD
  },
];
