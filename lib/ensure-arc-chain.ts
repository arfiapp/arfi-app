import { switchChain } from "wagmi/actions";
import { arcTestnet } from "./arc-chain";
import { wagmiConfig } from "./wagmi-config";

async function addArcChainToWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found.");
  }

  const chainIdHex = `0x${arcTestnet.id.toString(16)}`;

  await window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: chainIdHex,
        chainName: arcTestnet.name,
        rpcUrls: [arcTestnet.rpcUrls.default.http[0]],
        nativeCurrency: {
          name: arcTestnet.nativeCurrency.name,
          symbol: arcTestnet.nativeCurrency.symbol,
          decimals: arcTestnet.nativeCurrency.decimals
        },
        blockExplorerUrls: [arcTestnet.blockExplorers!.default.url]
      }
    ]
  });
}

export async function ensureArcChain() {
  try {
    await switchChain(wagmiConfig, { chainId: arcTestnet.id });
    return;
  } catch {
    // Chain not added to MetaMask yet — try adding it
  }

  try {
    await addArcChainToWallet();
    await switchChain(wagmiConfig, { chainId: arcTestnet.id });
  } catch {
    throw new Error(
      `Please select or add Arc Testnet (Chain ID ${arcTestnet.id}) in MetaMask. RPC: ${arcTestnet.rpcUrls.default.http[0]}`
    );
  }
}
