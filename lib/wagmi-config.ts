import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia, baseSepolia, arbitrumSepolia, optimismSepolia } from "wagmi/chains";
import { arcTestnet } from "./arc-chain";
import { createArcTransport } from "./viem-transport";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is missing.");
}

export const wagmiConfig = getDefaultConfig({
  appName: "Arfi",
  projectId: projectId || "00000000000000000000000000000000",
  chains: [arcTestnet, sepolia, baseSepolia, arbitrumSepolia, optimismSepolia],
  transports: {
    [arcTestnet.id]:       createArcTransport(),
    [sepolia.id]:          http(),
    [baseSepolia.id]:      http(),
    [arbitrumSepolia.id]:  http(),
    [optimismSepolia.id]:  http(),
  },
  ssr: true
});
