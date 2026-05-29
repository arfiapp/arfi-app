import { fallback, http, type Transport } from "viem";
import { ARC_RPC_URLS } from "./arc-chain";

/** Client-side: prefer local proxy first, then fall back to direct RPC endpoints */
export function createArcTransport(): Transport {
  const urls: string[] = [];

  if (typeof window !== "undefined") {
    urls.push(`${window.location.origin}/api/rpc`);
  }

  urls.push(...ARC_RPC_URLS);

  return fallback(
    urls.map((url) =>
      http(url, {
        timeout: 20_000,
        retryCount: 1
      })
    ),
    { rank: false }
  );
}
