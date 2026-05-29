"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Shuffle, Send, BarChart3 } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import { arcTestnet } from "@/lib/arc-chain";
import { ensureArcChain } from "@/lib/ensure-arc-chain";
import { useState } from "react";

/** Arfi logo — loaded from public/arfi-logo.svg */
function ArfiLogo() {
  return (
    <Image
      src="/arfi-logo.svg"
      alt="Arfi"
      width={88}
      height={32}
      priority
      style={{
        objectFit: "contain",
        mixBlendMode: "screen",   // siyah arka plan şeffaf görünür, beyaz yazı kalır
        filter: "brightness(1.1)"
      }}
    />
  );
}

const NAV_ITEMS = [
  { href: "/swap",      label: "Swap",      icon: ArrowLeftRight },
  { href: "/bridge",    label: "Bridge",    icon: Shuffle        },
  { href: "/send",      label: "Send",      icon: Send           },
  { href: "/portfolio", label: "Portfolio", icon: BarChart3      },
];

function shortenAddress(addr: string) {
  return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
}

function WalletArea() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const [switching, setSwitching] = useState(false);
  const wrongChain = isConnected && chainId !== arcTestnet.id;

  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal, mounted }) => {
          if (!mounted) return null;
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className="wallet-btn-primary"
            >
              Connect Wallet
            </button>
          );
        }}
      </ConnectButton.Custom>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {wrongChain && (
        <button
          type="button"
          disabled={switching}
          onClick={async () => {
            setSwitching(true);
            try { await ensureArcChain(); } catch { /* ignore */ }
            finally { setSwitching(false); }
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition"
        >
          {switching ? "Switching…" : "Switch to Arc"}
        </button>
      )}

      {/* Address pill */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium cursor-pointer select-none"
        style={{
          background: "rgba(168,85,247,0.12)",
          border: "1px solid rgba(168,85,247,0.25)"
        }}
        onClick={() => disconnect()}
        title="Click to disconnect"
      >
        {/* Status dot */}
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: wrongChain ? "#f59e0b" : "#a855f7", boxShadow: wrongChain ? "0 0 6px #f59e0b" : "0 0 6px #a855f7" }}
        />
        <span className="text-textPrimary">
          {address ? shortenAddress(address) : "Connected"}
        </span>
      </div>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      {/* Logo — Arfi */}
      <Link href="/swap" className="flex items-center select-none" aria-label="Arfi">
        <ArfiLogo />
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/swap" && pathname === "/");
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link ${active ? "active" : ""}`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Wallet */}
      <WalletArea />
    </nav>
  );
}
