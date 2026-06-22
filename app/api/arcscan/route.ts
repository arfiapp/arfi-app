/**
 * GET /api/arcscan?address=0x...&page=1&offset=5
 * Proxies requests to ArcScan Etherscan-compatible API to avoid CORS issues.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") ?? "";
  const page    = searchParams.get("page")    ?? "1";
  const offset  = searchParams.get("offset")  ?? "5";

  const upstream =
    `https://testnet.arcscan.app/api?module=account&action=txlist` +
    `&address=${address}&page=${page}&offset=${offset}&sort=desc`;

  try {
    const res = await fetch(upstream, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return Response.json({ error: "ArcScan proxy error", detail: String(e) }, { status: 502 });
  }
}
