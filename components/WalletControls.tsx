"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import { arcTestnet } from "@/lib/arc-chain";
import { ensureArcChain } from "@/lib/ensure-arc-chain";
import { useState } from "react";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletControls() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const [switching, setSwitching] = useState(false);

  const wrongChain = isConnected && chainId !== arcTestnet.id;

  const handleSwitchNetwork = async () => {
    setSwitching(true);
    try {
      await ensureArcChain();
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  };

  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal, mounted }) => {
          if (!mounted) return null;
          return (
            <button type="button" onClick={openConnectModal} className="wallet-btn wallet-btn-primary">
              Connect Wallet
            </button>
          );
        }}
      </ConnectButton.Custom>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-white/5 px-3 py-2 text-sm">
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
        <span className="text-textPrimary">{address ? shortenAddress(address) : "Connected"}</span>
        <span className="text-textSecondary">|</span>
        <span className={wrongChain ? "text-red-400" : "text-textSecondary"}>
          {wrongChain ? `Wrong network (${chainId})` : "Arc Testnet"}
        </span>
      </div>

      {wrongChain ? (
        <button
          type="button"
          onClick={() => void handleSwitchNetwork()}
          disabled={switching}
          className="wallet-btn wallet-btn-primary"
        >
          {switching ? "Switching..." : "Switch to Arc Testnet"}
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => disconnect()}
        className="wallet-btn wallet-btn-outline"
      >
        Disconnect
      </button>
    </div>
  );
}
