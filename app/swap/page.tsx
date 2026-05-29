import { SwapCard } from "@/components/SwapCard";

export default function SwapPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-8">
      <SwapCard />

      <p className="mt-6 text-center text-xs" style={{ color: "rgba(192,132,252,0.4)" }}>
        Powered by{" "}
        <a
          href="https://testnet.arcscan.app"
          target="_blank"
          rel="noreferrer"
          className="hover:text-purple-300 transition-colors"
        >
          Arc Testnet
        </a>
        {" · "}
        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-purple-300 transition-colors"
        >
          Faucet
        </a>
      </p>
    </main>
  );
}
