/**
 * Send — ERC-20 token transfer on Arc Testnet
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  erc20Abi,
  parseUnits,
  isAddress,
  type Hash,
  type EIP1193Provider,
} from "viem";
import { arcTestnet } from "./arc-chain";
import { createArcTransport } from "./viem-transport";
import type { PortfolioToken } from "./portfolio-tokens";

export type SendRequest = {
  provider: EIP1193Provider;
  from: `0x${string}`;
  to: `0x${string}`;
  token: PortfolioToken;
  /** Human-readable amount e.g. "10.5" */
  amount: string;
};

export type SendResult = {
  txHash: Hash;
  amount: string;
  symbol: string;
};

export function validateAddress(addr: string): addr is `0x${string}` {
  return isAddress(addr);
}

export async function sendTokens(req: SendRequest): Promise<SendResult> {
  const amountWei = parseUnits(req.amount, req.token.decimals);

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: createArcTransport(),
  });

  const walletClient = createWalletClient({
    chain: arcTestnet,
    transport: custom(req.provider),
  });

  const txHash = await walletClient.writeContract({
    account: req.from,
    chain: arcTestnet,
    address: req.token.address,
    abi: erc20Abi,
    functionName: "transfer",
    args: [req.to, amountWei],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });

  return { txHash, amount: req.amount, symbol: req.token.symbol };
}
