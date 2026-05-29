/**
 * Swap implementation using XyloNet DEX Router on Arc Testnet.
 *
 * Circle App Kit's stablecoinKits API returns "No route available" on Arc
 * Testnet because the lifi/fly liquidity provider has no active pool there.
 * XyloNet is the native DEX on Arc Testnet with a live USDC/EURC pool.
 *
 * Flow:
 *   1. estimateSwap  → XyloRouter.quote()  (view, no gas)
 *   2. executeSwap   → ERC-20 approve + XyloRouter.swap()
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  erc20Abi,
  parseUnits,
  formatUnits,
  maxUint256,
  type Hash
} from "viem";
import { arcTestnet } from "./arc-chain";
import { createArcTransport } from "./viem-transport";
import { getToken, type SwapTokenSymbol } from "./tokens";
import { XYLO_ROUTER_ADDRESS, XYLO_ROUTER_ABI } from "./xylo-router";

export type SwapRequest = {
  /** EIP-1193 provider from the connected wallet */
  provider: import("viem").EIP1193Provider;
  /** Wallet address */
  address: `0x${string}`;
  tokenIn: SwapTokenSymbol;
  tokenOut: SwapTokenSymbol;
  /** Human-readable amount, e.g. "10.5" */
  amountIn: string;
  /** Slippage in basis points, e.g. 100 = 1% */
  slippageBps: number;
};

export type SwapEstimate = {
  /** Human-readable estimated output amount */
  amountOut: string;
  /** Human-readable minimum output after slippage */
  minAmountOut: string;
  /** Price impact in basis points */
  priceImpactBps: number;
};

export type SwapResult = {
  transactionHash: Hash;
  amountOut: string;
};

function getPublicClient() {
  return createPublicClient({
    chain: arcTestnet,
    transport: createArcTransport()
  });
}

function getWalletClient(provider: import("viem").EIP1193Provider) {
  return createWalletClient({
    chain: arcTestnet,
    transport: custom(provider)
  });
}

export async function estimateSwap(req: SwapRequest): Promise<SwapEstimate> {
  const tokenInInfo = getToken(req.tokenIn);
  const tokenOutInfo = getToken(req.tokenOut);

  const amountInWei = parseUnits(req.amountIn, tokenInInfo.decimals);

  const publicClient = getPublicClient();

  const [amountOutWei, priceImpactRaw] = await publicClient.readContract({
    address: XYLO_ROUTER_ADDRESS,
    abi: XYLO_ROUTER_ABI,
    functionName: "quote",
    args: [tokenInInfo.address, tokenOutInfo.address, amountInWei]
  });

  // Apply slippage: minAmountOut = amountOut * (10000 - slippageBps) / 10000
  const slippageFactor = BigInt(10000 - req.slippageBps);
  const minAmountOutWei = (amountOutWei * slippageFactor) / 10000n;

  return {
    amountOut: formatUnits(amountOutWei, tokenOutInfo.decimals),
    minAmountOut: formatUnits(minAmountOutWei, tokenOutInfo.decimals),
    // priceImpact is returned in basis points (1e4 = 100%)
    priceImpactBps: Number(priceImpactRaw)
  };
}

export async function executeSwap(req: SwapRequest): Promise<SwapResult> {
  const tokenInInfo = getToken(req.tokenIn);
  const tokenOutInfo = getToken(req.tokenOut);

  const amountInWei = parseUnits(req.amountIn, tokenInInfo.decimals);

  const publicClient = getPublicClient();
  const walletClient = getWalletClient(req.provider);

  // ── Step 1: Get quote for minAmountOut ──────────────────────────────────
  const [amountOutWei] = await publicClient.readContract({
    address: XYLO_ROUTER_ADDRESS,
    abi: XYLO_ROUTER_ABI,
    functionName: "quote",
    args: [tokenInInfo.address, tokenOutInfo.address, amountInWei]
  });

  const slippageFactor = BigInt(10000 - req.slippageBps);
  const minAmountOutWei = (amountOutWei * slippageFactor) / 10000n;

  // ── Step 2: Check and set ERC-20 allowance ──────────────────────────────
  const currentAllowance = await publicClient.readContract({
    address: tokenInInfo.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [req.address, XYLO_ROUTER_ADDRESS]
  });

  if (currentAllowance < amountInWei) {
    // Approve maxUint256 so the user only needs to approve once
    const approveTx = await walletClient.writeContract({
      account: req.address,
      chain: arcTestnet,
      address: tokenInInfo.address,
      abi: erc20Abi,
      functionName: "approve",
      args: [XYLO_ROUTER_ADDRESS, maxUint256]
    });
    // Wait for approval to be mined before proceeding
    await publicClient.waitForTransactionReceipt({
      hash: approveTx,
      timeout: 60_000
    });
  }

  // ── Step 3: Execute swap ─────────────────────────────────────────────────
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min

  const swapTx = await walletClient.writeContract({
    account: req.address,
    chain: arcTestnet,
    address: XYLO_ROUTER_ADDRESS,
    abi: XYLO_ROUTER_ABI,
    functionName: "swap",
    args: [
      {
        tokenIn: tokenInInfo.address,
        tokenOut: tokenOutInfo.address,
        amountIn: amountInWei,
        minAmountOut: minAmountOutWei,
        to: req.address,
        deadline
      }
    ]
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTx });

  return {
    transactionHash: receipt.transactionHash,
    amountOut: formatUnits(amountOutWei, tokenOutInfo.decimals)
  };
}
