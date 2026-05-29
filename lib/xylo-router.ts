/**
 * XyloNet DEX Router — Arc Testnet
 *
 * Circle App Kit's stablecoinKits API currently returns "No route available"
 * on Arc Testnet. XyloNet is the native DEX on Arc Testnet with an active
 * USDC/EURC liquidity pool. We use it directly via viem.
 *
 * Contracts (Arc Testnet):
 *   Router:   0x73742278c31a76dBb0D2587d03ef92E6E2141023
 *   LP Pool:  0x3DF3966F5138143dce7a9cFDdC2c0310ce083BB1  (XYLO-USDC-EURC)
 */

export const XYLO_ROUTER_ADDRESS =
  "0x73742278c31a76dBb0D2587d03ef92E6E2141023" as const;

export const XYLO_ROUTER_ABI = [
  // ── Read ──────────────────────────────────────────────────────────────────
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" }
    ],
    name: "getAmountOut",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" }
    ],
    name: "quote",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "priceImpact", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  // ── Write ─────────────────────────────────────────────────────────────────
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "minAmountOut", type: "uint256" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" }
        ],
        internalType: "struct IXyloRouter.SwapParams",
        name: "params",
        type: "tuple"
      }
    ],
    name: "swap",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
