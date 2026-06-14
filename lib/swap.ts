/**
 * Swap implementation — hybrid routing on Arc Testnet.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  Pair             │  Router                             │
 * ├─────────────────────────────────────────────────────────┤
 * │  USDC ↔ EURC      │  XyloNet DEX (on-chain, fast)       │
 * │  *   ↔ cirBTC     │  Circle App Kit (off-chain quote)   │
 * └─────────────────────────────────────────────────────────┘
 *
 * Circle App Kit supports cirBTC natively via "cirBTC" token alias.
 * XyloRouter has no cirBTC liquidity pool on Arc Testnet.
 *
 * Docs: https://docs.arc.network/app-kit/swap
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  erc20Abi,
  parseUnits,
  formatUnits,
  maxUint256,
  type Hash,
  type EIP1193Provider,
  type PublicClient,
} from "viem";
import { AppKit } from "@circle-fin/app-kit";
import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { ARC_CHAIN_APP_KIT, arcTestnet } from "./arc-chain";
import { createArcTransport } from "./viem-transport";
import { getToken, type SwapTokenSymbol } from "./tokens";
import { XYLO_ROUTER_ADDRESS, XYLO_ROUTER_ABI } from "./xylo-router";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SwapRequest = {
  provider: EIP1193Provider;
  address: `0x${string}`;
  tokenIn: SwapTokenSymbol;
  tokenOut: SwapTokenSymbol;
  /** Human-readable amount, e.g. "10.5" */
  amountIn: string;
  /** Slippage in basis points, e.g. 100 = 1% */
  slippageBps: number;
};

export type SwapEstimate = {
  amountOut: string;
  minAmountOut: string;
  priceImpactBps: number;
};

export type SwapResult = {
  transactionHash: Hash;
  amountOut: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** True when the pair requires Circle App Kit (cirBTC involved). */
function needsAppKit(tokenIn: SwapTokenSymbol, tokenOut: SwapTokenSymbol): boolean {
  return tokenIn === "cirBTC" || tokenOut === "cirBTC";
}

function getKitKey(): string {
  const key = process.env.NEXT_PUBLIC_KIT_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_KIT_KEY is missing. Check your .env.local file.");
  return key;
}

// Reuse a single PublicClient for Arc Testnet
let _publicClient: PublicClient | null = null;
function getPublicClient(): PublicClient {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: arcTestnet,
      transport: createArcTransport(),
    });
  }
  return _publicClient;
}

function getWalletClient(provider: EIP1193Provider) {
  return createWalletClient({ chain: arcTestnet, transport: custom(provider) });
}

// App Kit singleton
const kit = new AppKit();

// ── Amount formatting ─────────────────────────────────────────────────────────

/**
 * Format a human-readable amount string for Circle App Kit.
 * App Kit's `amountIn` schema requires a decimal string (e.g. "1.00").
 * It validates with /^\d+(\.\d+)?$/ — no scientific notation, no base units.
 *
 * cirBTC: up to 8 significant decimal places
 * USDC/EURC: up to 6 decimal places
 */
function formatForKit(amount: string, decimals: number): string {
  const n = parseFloat(amount.trim());
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Enter a valid amount.");
  }

  if (decimals === 8) {
    // cirBTC — preserve up to 8 decimal places, no trailing zeros
    const fixed = n.toFixed(8).replace(/\.?0+$/, "");
    return fixed.includes(".") ? fixed : fixed + ".00";
  }

  // USDC / EURC (6 decimals)
  if (n >= 1)    return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(6);
}

// ── XyloRouter path (USDC ↔ EURC) ────────────────────────────────────────────

async function estimateXylo(req: SwapRequest): Promise<SwapEstimate> {
  const tokenInInfo  = getToken(req.tokenIn);
  const tokenOutInfo = getToken(req.tokenOut);
  const amountInWei  = parseUnits(req.amountIn, tokenInInfo.decimals);

  const publicClient = getPublicClient();
  const [amountOutWei, priceImpactRaw] = await publicClient.readContract({
    address: XYLO_ROUTER_ADDRESS,
    abi: XYLO_ROUTER_ABI,
    functionName: "quote",
    args: [tokenInInfo.address, tokenOutInfo.address, amountInWei],
  });

  const slippageFactor  = BigInt(10000 - req.slippageBps);
  const minAmountOutWei = (amountOutWei * slippageFactor) / 10000n;

  return {
    amountOut:      formatUnits(amountOutWei, tokenOutInfo.decimals),
    minAmountOut:   formatUnits(minAmountOutWei, tokenOutInfo.decimals),
    priceImpactBps: Number(priceImpactRaw),
  };
}

async function executeXylo(req: SwapRequest): Promise<SwapResult> {
  const tokenInInfo  = getToken(req.tokenIn);
  const tokenOutInfo = getToken(req.tokenOut);
  const amountInWei  = parseUnits(req.amountIn, tokenInInfo.decimals);

  const publicClient = getPublicClient();
  const walletClient = getWalletClient(req.provider);

  // Get expected output for minAmountOut
  const [amountOutWei] = await publicClient.readContract({
    address: XYLO_ROUTER_ADDRESS,
    abi: XYLO_ROUTER_ABI,
    functionName: "quote",
    args: [tokenInInfo.address, tokenOutInfo.address, amountInWei],
  });

  const slippageFactor  = BigInt(10000 - req.slippageBps);
  const minAmountOutWei = (amountOutWei * slippageFactor) / 10000n;

  // ERC-20 approve (maxUint256 so user only approves once)
  const currentAllowance = await publicClient.readContract({
    address: tokenInInfo.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [req.address, XYLO_ROUTER_ADDRESS],
  });

  if (currentAllowance < amountInWei) {
    const approveTx = await walletClient.writeContract({
      account:      req.address,
      chain:        arcTestnet,
      address:      tokenInInfo.address,
      abi:          erc20Abi,
      functionName: "approve",
      args:         [XYLO_ROUTER_ADDRESS, maxUint256],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx, timeout: 60_000 });
  }

  // Execute swap
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min
  const swapTx   = await walletClient.writeContract({
    account:      req.address,
    chain:        arcTestnet,
    address:      XYLO_ROUTER_ADDRESS,
    abi:          XYLO_ROUTER_ABI,
    functionName: "swap",
    args: [{
      tokenIn:      tokenInInfo.address,
      tokenOut:     tokenOutInfo.address,
      amountIn:     amountInWei,
      minAmountOut: minAmountOutWei,
      to:           req.address,
      deadline,
    }],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTx });
  return {
    transactionHash: receipt.transactionHash,
    amountOut: formatUnits(amountOutWei, tokenOutInfo.decimals),
  };
}

// ── Circle App Kit path (cirBTC pairs) ────────────────────────────────────────

/**
 * Build a ViemAdapter backed by the user's browser wallet.
 * ArcTestnet must be listed in supportedChains so the SDK can resolve
 * token addresses and validate chain support.
 */
async function buildAdapter(provider: EIP1193Provider) {
  return createViemAdapterFromProvider({
    provider,
    getPublicClient: () => getPublicClient(),
    capabilities: {
      addressContext: "user-controlled",
      supportedChains: [ArcTestnet], // required — do NOT pass []
    },
  });
}

async function estimateAppKit(req: SwapRequest): Promise<SwapEstimate> {
  const tokenOutInfo = getToken(req.tokenOut);
  const tokenInInfo  = getToken(req.tokenIn);
  const amountIn     = formatForKit(req.amountIn, tokenInInfo.decimals);

  const adapter  = await buildAdapter(req.provider);
  const estimate = await kit.estimateSwap({
    from:     { adapter, chain: ARC_CHAIN_APP_KIT },
    tokenIn:  req.tokenIn,
    tokenOut: req.tokenOut,
    amountIn,
    config: {
      kitKey:            getKitKey(),
      slippageBps:       req.slippageBps,
      allowanceStrategy: "approve" as const,
    },
  });

  // SDK returns estimatedOutput: { amount: string, token: string }
  const out = (estimate as { estimatedOutput?: { amount?: string } }).estimatedOutput?.amount ?? "0";

  // Apply slippage to get minAmountOut
  const outNum     = parseFloat(out);
  const minOutNum  = outNum * (1 - req.slippageBps / 10000);
  const minOut     = minOutNum.toFixed(tokenOutInfo.decimals);

  return {
    amountOut:      out,
    minAmountOut:   minOut,
    priceImpactBps: 0,
  };
}

async function executeAppKit(req: SwapRequest): Promise<SwapResult> {
  const tokenInInfo = getToken(req.tokenIn);
  const amountIn    = formatForKit(req.amountIn, tokenInInfo.decimals);

  const adapter = await buildAdapter(req.provider);
  const result  = await kit.swap({
    from:     { adapter, chain: ARC_CHAIN_APP_KIT },
    tokenIn:  req.tokenIn,
    tokenOut: req.tokenOut,
    amountIn,
    config: {
      kitKey:            getKitKey(),
      slippageBps:       req.slippageBps,
      allowanceStrategy: "approve" as const,
    },
  });

  // Safely extract txHash — App Kit result shape may vary
  const r = result as unknown as Record<string, unknown>;
  const hash = (
    (typeof r.transactionHash === "string" ? r.transactionHash : undefined) ??
    (typeof r.txHash          === "string" ? r.txHash          : undefined) ??
    "0x"
  ) as Hash;

  const amountOutRaw = r.amountOut ?? r.estimatedOutput;
  const amountOut =
    typeof amountOutRaw === "string"
      ? amountOutRaw
      : typeof amountOutRaw === "object" && amountOutRaw !== null
        ? String((amountOutRaw as Record<string, unknown>).amount ?? "0")
        : "0";

  return { transactionHash: hash, amountOut };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function estimateSwap(req: SwapRequest): Promise<SwapEstimate> {
  return needsAppKit(req.tokenIn, req.tokenOut)
    ? estimateAppKit(req)
    : estimateXylo(req);
}

export async function executeSwap(req: SwapRequest): Promise<SwapResult> {
  return needsAppKit(req.tokenIn, req.tokenOut)
    ? executeAppKit(req)
    : executeXylo(req);
}
