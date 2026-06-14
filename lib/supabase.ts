import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActivityType = "swap" | "bridge" | "send";

export const POINTS: Record<ActivityType, number> = {
  swap:   50,
  bridge: 50,
  send:   50,
};

export type LeaderboardEntry = {
  address:      string;
  total_points: number;
  swap_count:   number;
  bridge_count: number;
  send_count:   number;
  last_activity: string;
};

// ── Record a completed activity ───────────────────────────────────────────────

export async function recordActivity(
  address: string,
  type: ActivityType,
  txHash: string
): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return; // skip if not configured

  const points = POINTS[type];

  // Upsert into leaderboard
  const { data: existing } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("address", address.toLowerCase())
    .single();

  if (existing) {
    await supabase
      .from("leaderboard")
      .update({
        total_points:  existing.total_points + points,
        swap_count:    existing.swap_count   + (type === "swap"   ? 1 : 0),
        bridge_count:  existing.bridge_count + (type === "bridge" ? 1 : 0),
        send_count:    existing.send_count   + (type === "send"   ? 1 : 0),
        last_activity: new Date().toISOString(),
      })
      .eq("address", address.toLowerCase());
  } else {
    await supabase.from("leaderboard").insert({
      address:      address.toLowerCase(),
      total_points: points,
      swap_count:   type === "swap"   ? 1 : 0,
      bridge_count: type === "bridge" ? 1 : 0,
      send_count:   type === "send"   ? 1 : 0,
      last_activity: new Date().toISOString(),
    });
  }

  // Also log the individual activity
  await supabase.from("activities").insert({
    address: address.toLowerCase(),
    type,
    points,
    tx_hash: txHash,
    created_at: new Date().toISOString(),
  });
}

// ── Fetch leaderboard ─────────────────────────────────────────────────────────

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!supabaseUrl || !supabaseKey) return [];

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Leaderboard fetch error:", error);
    return [];
  }

  return data ?? [];
}
