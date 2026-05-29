import type { Connector } from "wagmi";
import type { EIP1193Provider, WalletClient } from "viem";

function isEip1193Provider(value: unknown): value is EIP1193Provider {
  return (
    typeof value === "object" &&
    value !== null &&
    "request" in value &&
    typeof (value as EIP1193Provider).request === "function"
  );
}

export async function getEip1193Provider(
  connector?: Connector,
  walletClient?: WalletClient | null
): Promise<EIP1193Provider> {
  if (connector?.getProvider) {
    const fromConnector = await connector.getProvider();
    if (isEip1193Provider(fromConnector)) return fromConnector;
  }

  if (walletClient?.transport && isEip1193Provider(walletClient.transport)) {
    return walletClient.transport;
  }

  if (typeof window !== "undefined" && isEip1193Provider(window.ethereum)) {
    return window.ethereum;
  }

  throw new Error("Wallet provider not found. Please reconnect your wallet.");
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}
