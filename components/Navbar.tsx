"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Shuffle, Send, BarChart3, Trophy } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import { arcTestnet } from "@/lib/arc-chain";
import { ensureArcChain } from "@/lib/ensure-arc-chain";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/swap",        label: "Swap",        icon: ArrowLeftRight },
  { href: "/bridge",      label: "Bridge",      icon: Shuffle        },
  { href: "/send",        label: "Send",        icon: Send           },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy         },
  { href: "/portfolio",   label: "Portfolio",   icon: BarChart3      },
];

function shortenAddress(addr: string) {
  return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
}

function ArfiLogo() {
  return (
    <Image
      src="/arfi-logo.svg"
      alt="Arfi"
      width={80}
      height={28}
      priority
      style={{ objectFit: "contain", mixBlendMode: "screen", filter: "brightness(1.1)" }}
    />
  );
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
            <button type="button" onClick={openConnectModal} className="wallet-btn-primary whitespace-nowrap">
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
          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 bg-amber-500/10 whitespace-nowrap"
        >
          {switching ? "…" : "Switch"}
        </button>
      )}
      <div
        className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium cursor-pointer select-none"
        style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)" }}
        onClick={() => disconnect()}
        title="Click to disconnect"
      >
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: wrongChain ? "#f59e0b" : "#a855f7", boxShadow: wrongChain ? "0 0 4px #f59e0b" : "0 0 4px #a855f7" }}
        />
        <span className="text-textPrimary">{address ? shortenAddress(address) : "Connected"}</span>
      </div>
    </div>
  );
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href === "/swap" && pathname === "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              color: active ? "#f3e8ff" : "rgba(192,132,252,0.65)",
              background: active ? "rgba(168,85,247,0.2)" : "transparent",
              border: active ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </>
  );
}

const BAR_STYLE = {
  background: "rgba(13, 0, 21, 0.9)",
  backdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(168, 85, 247, 0.12)",
};

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP (md+): single bar — Logo | Nav links | Wallet
      ══════════════════════════════════════════════════════════════════ */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6 py-3"
        style={BAR_STYLE}
      >
        {/* Logo */}
        <Link href="/swap" className="flex items-center select-none shrink-0" aria-label="Arfi">
          <ArfiLogo />
        </Link>

        {/* Nav links — centered */}
        <div className="flex items-center gap-1">
          <NavLinks pathname={pathname} />
        </div>

        {/* Wallet */}
        <div className="shrink-0">
          <WalletArea />
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE (<md): two rows
          Row 1: Logo | Wallet
          Row 2: Nav tabs (scrollable)
      ══════════════════════════════════════════════════════════════════ */}
      {/* Row 1 */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2.5"
        style={BAR_STYLE}
      >
        <Link href="/swap" className="flex items-center select-none" aria-label="Arfi">
          <ArfiLogo />
        </Link>
        <WalletArea />
      </div>

      {/* Row 2 */}
      <div
        className="md:hidden fixed top-[62px] left-0 right-0 z-40 flex items-center gap-1 px-3 py-2 overflow-x-auto"
        style={{
          background: "rgba(13, 0, 21, 0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(168, 85, 247, 0.1)",
          scrollbarWidth: "none",
        }}
      >
        <NavLinks pathname={pathname} />
      </div>
    </>
  );
}
