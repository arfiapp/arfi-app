import { BridgeCard } from "@/components/BridgeCard";

export default function BridgePage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold text-textPrimary">
          USDC Bridge
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(192,132,252,0.5)" }}>
          Cross-chain USDC transfers via Circle CCTP V2
        </p>
      </div>

      <BridgeCard />

      <p className="mt-6 text-center text-xs" style={{ color: "rgba(192,132,252,0.3)" }}>
        Powered by{" "}
        <a href="https://developers.circle.com/cctp" target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">
          Circle CCTP V2
        </a>
        {" · "}
        <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">
          Get testnet USDC
        </a>
      </p>
    </main>
  );
}
