import { PortfolioCard } from "@/components/PortfolioCard";

export default function PortfolioPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center px-4 py-8">
      <div className="mb-6 w-full max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-textPrimary">Portfolio</h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(192,132,252,0.5)" }}>
          Your Arc Testnet token balances
        </p>
      </div>

      <PortfolioCard />
    </main>
  );
}
