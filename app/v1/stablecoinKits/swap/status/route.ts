import { proxyCircleApi } from "@/lib/circle-proxy";

export async function GET(request: Request) {
  return proxyCircleApi(request, "/v1/stablecoinKits/swap/status");
}

export async function POST(request: Request) {
  return proxyCircleApi(request, "/v1/stablecoinKits/swap/status");
}
