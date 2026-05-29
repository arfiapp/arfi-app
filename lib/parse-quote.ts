import { formatUnits } from "viem";
import { getToken } from "./tokens";
import type { SwapTokenSymbol } from "./tokens";

type TokenAmount = { amount?: string; token?: string };
type QuoteRoute = { estimatedAmount?: string; minAmount?: string };
type QuoteWrapper = { quote?: QuoteRoute };

function readTokenAmount(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const obj = value as TokenAmount;
    if (typeof obj.amount === "string") return obj.amount;
  }
  return "";
}

/**
 * Circle estimateSwap / quote API yanıtından insan-okunur çıktı miktarı çıkarır.
 *
 * API yanıt yapıları:
 *  - SDK estimate sonucu: { estimatedOutput: { amount: "0.9334", token: "EURC" } }
 *  - Ham quote API:       { quote: { estimatedAmount: "933430" } }  (base units)
 */
export function parseEstimatedAmountOut(
  estimate: unknown,
  tokenOut?: SwapTokenSymbol
): string {
  if (!estimate || typeof estimate !== "object") return "";

  const record = estimate as Record<string, unknown>;

  // SDK'nın formatlanmış çıktısı: { estimatedOutput: { amount: "0.9334", token: "EURC" } }
  const fromEstimated = readTokenAmount(record.estimatedOutput);
  if (fromEstimated) return fromEstimated;

  // Doğrudan string
  if (typeof record.amountOut === "string") return record.amountOut;
  const fromAmountOut = readTokenAmount(record.amountOut);
  if (fromAmountOut) return fromAmountOut;

  // Ham quote API yanıtı: { quote: { estimatedAmount: "933430" } }
  const quoteWrapper = record as QuoteWrapper;
  const rawAmount = quoteWrapper.quote?.estimatedAmount;
  if (rawAmount) {
    // base units → human readable
    const decimals = tokenOut ? getToken(tokenOut).decimals : 6;
    return formatUnits(BigInt(rawAmount), decimals);
  }

  return "";
}
