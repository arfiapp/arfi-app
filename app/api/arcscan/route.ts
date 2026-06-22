/**
 * GET /api/arcscan?path=/v2/addresses/0x.../transactions&limit=10&filter=...
 * Proxies requests to ArcScan (Blockscout) REST API to avoid CORS issues.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path   = searchParams.get("path") ?? "";
  const rest   = new URLSearchParams(searchParams);
  rest.delete("path");

  const upstream = `https://testnet.arcscan.app/api${path}?${rest.toString()}`;

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
