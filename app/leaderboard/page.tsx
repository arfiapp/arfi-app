import { LeaderboardCard } from "@/components/LeaderboardCard";

export default function LeaderboardPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center px-4 py-8">
      <div className="mb-6 w-full max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-textPrimary">Leaderboard</h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(192,132,252,0.5)" }}>
          Top traders ranked by score
        </p>
      </div>
      <LeaderboardCard />
    </main>
  );
}
