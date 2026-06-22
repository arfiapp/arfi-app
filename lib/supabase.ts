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

// ── Activity entry type ───────────────────────────────────────────────────────

export type ActivityEntry = {
  id:         string;
  address:    string;
  type:       ActivityType;
  points:     number;
  tx_hash:    string;
  created_at: string;
};

// ── On-chain transaction from ArcScan (Blockscout REST API) ──────────────────

export type OnChainTx = {
  hash:       string;
  timestamp:  string;   // ISO
  status:     "ok" | "error";
  method:     string | null;
  value:      string;   // in wei (native USDC 18 dec)
  from:       string;
  to:         string | null;
  fee:        string;   // gas fee in USDC
};

export async function fetchOnChainTxs(
  address: string,
  page = 1,
  pageSize = 5
): Promise<{ data: OnChainTx[]; total: number; hasNextPage: boolean }> {

  // Use local proxy (browser) to avoid CORS; direct URL on server
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/api/arcscan?address=${address}&page=${page}&offset=${pageSize}`
    : `https://testnet.arcscan.app/api?module=account&action=txlist&address=${address}&page=${page}&offset=${pageSize}&sort=desc`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) return { data: [], total: 0, hasNextPage: false };

    const json = await res.json() as {
      status: string;
      message: string;
      result: Array<{
        hash:        string;
        timeStamp:   string;
        from:        string;
        to:          string;
        value:       string;
        gas:         string;
        gasPrice:    string;
        gasUsed:     string;
        isError:     string;
        functionName?: string;
        methodId?:   string;
      }> | null;
    };

    if (json.status !== "1" || !json.result || json.result.length === 0) {
      return { data: [], total: 0, hasNextPage: false };
    }

    const items: OnChainTx[] = json.result.map(tx => {
      // Extract method name from functionName (e.g. "swap(address...)" → "swap")
      const rawMethod = tx.functionName ?? "";
      const method    = rawMethod ? rawMethod.split("(")[0] : null;

      return {
        hash:      tx.hash,
        timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
        status:    tx.isError === "0" ? "ok" : "error",
        method,
        value:     tx.value,
        from:      tx.from,
        to:        tx.to || null,
        fee:       String(BigInt(tx.gasUsed) * BigInt(tx.gasPrice)),
      };
    });

    // ArcScan returns exactly `offset` items if more exist
    const hasNextPage = json.result.length >= pageSize;

    return { data: items, total: page * pageSize + (hasNextPage ? 1 : 0), hasNextPage };
  } catch (e) {
    console.error("[fetchOnChainTxs] error:", e);
    return { data: [], total: 0, hasNextPage: false };
  }
}

// ── Fetch activities for a wallet (Supabase — arfi-recorded only) ─────────────

export async function fetchActivities(
  address: string,
  page = 1,
  pageSize = 5
): Promise<{ data: ActivityEntry[]; total: number }> {
  if (!supabaseUrl || !supabaseKey) return { data: [], total: 0 };

  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("activities")
    .select("*", { count: "exact" })
    .eq("address", address.toLowerCase())
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("fetchActivities error:", error);
    return { data: [], total: 0 };
  }

  return { data: (data ?? []) as ActivityEntry[], total: count ?? 0 };
}

// ── Fetch leaderboard ─────────────────────────────────────────────────────────

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!supabaseUrl || !supabaseKey) return [];

  // First get total count
  const { count } = await supabase
    .from("leaderboard")
    .select("*", { count: "exact", head: true });

  console.log("[leaderboard] total rows in DB:", count);

  const all: LeaderboardEntry[] = [];
  const PAGE = 100; // stay within Supabase default max per request

  let from = 0;
  const total = count ?? 10000;

  while (from < total) {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("total_points", { ascending: false })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error("[leaderboard] fetch error at range", from, error);
      break;
    }

    if (!data || data.length === 0) break;

    all.push(...data);
    console.log(`[leaderboard] fetched rows ${from}–${from + data.length - 1}, total so far: ${all.length}`);

    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log("[leaderboard] final count returned:", all.length);
  return all;
}
