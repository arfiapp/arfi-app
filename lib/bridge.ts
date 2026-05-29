/**
 * CCTP V2 Bridge — burn on source chain, mint on destination chain
 *
 * Flow:
 *   1. approve USDC to TokenMessenger (if needed)
 *   2. depositForBurn  → emits MessageSent event with nonce
 *   3. poll Iris API   → wait for attestation
 *   4. receiveMessage  → mint USDC on destination chain
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  erc20Abi,
  parseUnits,
  formatUnits,
  maxUint256,
  decodeEventLog,
  type Hash,
  type EIP1193Provider,
} from "viem";
import type { CctpChain } from "./cctp-chains";
import { IRIS_API } from "./cctp-chains";

// ── ABIs ─────────────────────────────────────────────────────────────────────

const TOKEN_MESSENGER_ABI = [
  {
    name: "depositForBurn",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount",           type: "uint256" },
      { name: "destinationDomain",type: "uint32"  },
      { name: "mintRecipient",    type: "bytes32" },
      { name: "burnToken",        type: "address" },
      { name: "destinationCaller",type: "bytes32" },
      { name: "maxFee",           type: "uint256" },
      { name: "minFinalityThreshold", type: "uint32" },
    ],
    outputs: [{ name: "nonce", type: "bytes32" }],
  },
] as const;

const MESSAGE_TRANSMITTER_ABI = [
  {
    name: "receiveMessage",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "message",     type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

const MESSAGE_SENT_ABI = [
  {
    name: "MessageSent",
    type: "event",
    inputs: [{ name: "message", type: "bytes", indexed: false }],
  },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type BridgeRequest = {
  provider: EIP1193Provider;
  address: `0x${string}`;
  sourceChain: CctpChain;
  destChain: CctpChain;
  /** Human-readable USDC amount, e.g. "10.5" */
  amount: string;
};

export type BridgeStatus =
  | "idle"
  | "approving"
  | "burning"
  | "attesting"
  | "minting"
  | "success"
  | "error";

export type BridgeResult = {
  burnTxHash: Hash;
  mintTxHash: Hash;
  amount: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function addressToBytes32(addr: `0x${string}`): `0x${string}` {
  return `0x${addr.slice(2).padStart(64, "0")}` as `0x${string}`;
}

function getPublicClient(chain: CctpChain) {
  return createPublicClient({
    transport: http(chain.rpcUrl, { timeout: 30_000, retryCount: 3 }),
  });
}

function getWalletClient(provider: EIP1193Provider, chain: CctpChain) {
  return createWalletClient({
    transport: custom(provider),
  });
}

// ── Attestation polling ───────────────────────────────────────────────────────

async function pollAttestation(
  messageHash: string,
  onStatus?: (msg: string) => void,
  maxWaitMs = 300_000
): Promise<string> {
  const url = `${IRIS_API}/v2/messages/${messageHash}`;
  const deadline = Date.now() + maxWaitMs;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    try {
      const res = await fetch(url);

      if (res.status === 404) {
        // Normal — attestation not ready yet
        onStatus?.(`Waiting for attestation… (${attempt})`);
        await sleep(4000);
        continue;
      }

      if (!res.ok) {
        onStatus?.(`Attestation API error ${res.status}, retrying…`);
        await sleep(5000);
        continue;
      }

      const data = await res.json() as {
        messages?: Array<{ attestation?: string; status?: string }>;
      };

      const msg = data.messages?.[0];
      if (msg?.attestation && msg.attestation !== "PENDING") {
        return msg.attestation;
      }

      onStatus?.(`Attestation pending… (${attempt})`);
      await sleep(4000);
    } catch {
      onStatus?.(`Network error, retrying… (${attempt})`);
      await sleep(5000);
    }
  }

  throw new Error("Attestation timed out after 5 minutes. The burn transaction may still be processing — check ArcScan.");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Main bridge function ──────────────────────────────────────────────────────

export async function executeBridge(
  req: BridgeRequest,
  onStatus?: (status: BridgeStatus, message: string) => void
): Promise<BridgeResult> {
  const { provider, address, sourceChain, destChain, amount } = req;

  const amountWei = parseUnits(amount, 6); // USDC always 6 decimals

  const srcPublic  = getPublicClient(sourceChain);
  const srcWallet  = getWalletClient(provider, sourceChain);
  const destPublic = getPublicClient(destChain);
  const destWallet = getWalletClient(provider, destChain);

  // ── Step 1: Approve ────────────────────────────────────────────────────────
  onStatus?.("approving", "Step 1/4: Approving USDC…");

  const allowance = await srcPublic.readContract({
    address: sourceChain.usdcAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address, sourceChain.tokenMessenger],
  });

  if (allowance < amountWei) {
    const approveTx = await srcWallet.writeContract({
      account: address,
      chain: null,
      address: sourceChain.usdcAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [sourceChain.tokenMessenger, maxUint256],
    });
    await srcPublic.waitForTransactionReceipt({ hash: approveTx, timeout: 60_000 });
  }

  // ── Step 2: depositForBurn ─────────────────────────────────────────────────
  onStatus?.("burning", "Step 2/4: Burning USDC on source chain…");

  const mintRecipient = addressToBytes32(address);
  const zeroCaller    = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

  const burnTx = await srcWallet.writeContract({
    account: address,
    chain: null,
    address: sourceChain.tokenMessenger,
    abi: TOKEN_MESSENGER_ABI,
    functionName: "depositForBurn",
    args: [
      amountWei,
      destChain.domain,
      mintRecipient,
      sourceChain.usdcAddress,
      zeroCaller,
      0n,    // maxFee = 0 (standard transfer)
      1000,  // minFinalityThreshold = Confirmed (fast)
    ],
  });

  const burnReceipt = await srcPublic.waitForTransactionReceipt({
    hash: burnTx,
    timeout: 120_000,
  });

  // Extract message bytes from MessageSent event
  let messageBytes: `0x${string}` | undefined;
  for (const log of burnReceipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: MESSAGE_SENT_ABI,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "MessageSent") {
        messageBytes = decoded.args.message as `0x${string}`;
        break;
      }
    } catch { /* not this log */ }
  }

  if (!messageBytes) {
    throw new Error("Could not find MessageSent event in burn transaction. Check ArcScan: " + burnTx);
  }

  // Compute keccak256 of message for Iris API lookup
  const { keccak256 } = await import("viem");
  const messageHash = keccak256(messageBytes);

  // ── Step 3: Poll attestation ───────────────────────────────────────────────
  onStatus?.("attesting", "Step 3/4: Waiting for Circle attestation…");

  const attestation = await pollAttestation(
    messageHash,
    (msg) => onStatus?.("attesting", `Step 3/4: ${msg}`)
  );

  // ── Step 4: receiveMessage on destination ──────────────────────────────────
  onStatus?.("minting", "Step 4/4: Minting USDC on destination chain…");

  const mintTx = await destWallet.writeContract({
    account: address,
    chain: null,
    address: destChain.messageTransmitter,
    abi: MESSAGE_TRANSMITTER_ABI,
    functionName: "receiveMessage",
    args: [messageBytes, attestation as `0x${string}`],
  });

  await destPublic.waitForTransactionReceipt({ hash: mintTx, timeout: 120_000 });

  return {
    burnTxHash: burnTx,
    mintTxHash: mintTx,
    amount: formatUnits(amountWei, 6),
  };
}

// ── Balance helper ────────────────────────────────────────────────────────────

export async function getUsdcBalance(
  chain: CctpChain,
  address: `0x${string}`
): Promise<string> {
  const client = getPublicClient(chain);
  const raw = await client.readContract({
    address: chain.usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
  return formatUnits(raw, 6);
}
