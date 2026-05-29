import { defineChain } from "viem";

/** docs.arc.io/arc/references/rpc-endpoints */
export const ARC_RPC_URLS = [
  "https://rpc.testnet.arc.network",
  "https://rpc.drpc.testnet.arc.network",
  "https://rpc.quicknode.testnet.arc.network",
  "https://rpc.blockdaemon.testnet.arc.network"
] as const;

const envRpc = process.env.NEXT_PUBLIC_ARC_RPC?.trim();
const primaryRpc =
  envRpc && !envRpc.includes("rpc.arc.network")
    ? envRpc
    : ARC_RPC_URLS[0];

const rpcList = envRpc && !envRpc.includes("rpc.arc.network")
  ? [envRpc, ...ARC_RPC_URLS.filter((u) => u !== envRpc)]
  : [...ARC_RPC_URLS];

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "5042002");

if (chainId !== 5042002) {
  console.warn(
    `NEXT_PUBLIC_CHAIN_ID=${chainId} — expected 5042002 for Arc Testnet.`
  );
}

/** Arc Testnet — docs.arc.io */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: {
    default: { http: [...rpcList] },
    public: { http: [...rpcList] }
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app"
    }
  },
  testnet: true
});

export const arcPrimaryRpc = primaryRpc;

export const ARC_CHAIN_APP_KIT = "Arc_Testnet" as const;

export const arcTxUrl = (hash: string) =>
  `${arcTestnet.blockExplorers!.default.url}/tx/${hash}`;
