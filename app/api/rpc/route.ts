import { ARC_RPC_URLS } from "@/lib/arc-chain";

/** Browser → Next.js → Arc RPC (prevents CORS / network blocking) */
export async function POST(request: Request) {
  const body = await request.text();

  for (const rpcUrl of ARC_RPC_URLS) {
    try {
      const upstream = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(15_000)
      });

      const text = await upstream.text();
      if (upstream.ok) {
        return new Response(text, {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch {
      continue;
    }
  }

  return Response.json(
    { jsonrpc: "2.0", error: { message: "All Arc RPC endpoints failed" }, id: null },
    { status: 502 }
  );
}
