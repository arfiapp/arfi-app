import { parseUnits } from "viem";
import type { SwapTokenSymbol } from "./tokens";

/** On Arc, gas is paid in USDC — reserve some for swap transactions */
export const USDC_GAS_RESERVE = parseUnits("1", 6);

export const MIN_NATIVE_USDC_FOR_GAS = parseUnits("0.1", 18);

export function maxSwappableAmount(balance: bigint, tokenIn: SwapTokenSymbol): bigint {
  if (balance === 0n) return 0n;
  if (tokenIn === "USDC") {
    return balance > USDC_GAS_RESERVE ? balance - USDC_GAS_RESERVE : 0n;
  }
  return balance;
}
