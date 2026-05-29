import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import type { Connector } from "wagmi";
import { createPublicClient, type Chain, type PublicClient } from "viem";
import type { WalletClient } from "viem";
import { arcTestnet } from "./arc-chain";
import { getEip1193Provider } from "./wallet-provider";
import { createArcTransport } from "./viem-transport";

const publicClients = new Map<number, PublicClient>();

function getPublicClientForChain(chain: Chain): PublicClient {
  if (publicClients.has(chain.id)) {
    return publicClients.get(chain.id)!;
  }

  const viemChain = chain.id === arcTestnet.id ? arcTestnet : chain;
  const client = createPublicClient({
    chain: viemChain,
    transport: createArcTransport()
  });

  publicClients.set(chain.id, client);
  return client;
}

export async function createSwapAdapter(
  connector: Connector | undefined,
  walletClient: WalletClient | null | undefined
) {
  const provider = await getEip1193Provider(connector, walletClient);

  return createViemAdapterFromProvider({
    provider,
    getPublicClient: ({ chain }) => getPublicClientForChain(chain),
    capabilities: {
      addressContext: "user-controlled",
      supportedChains: [ArcTestnet]
    }
  });
}
