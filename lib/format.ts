import { formatUnits, parseUnits } from "viem";

export function formatTokenAmount(value: bigint, decimals: number, maxFrac = 6): string {
  const raw = formatUnits(value, decimals);
  const num = Number(raw);
  if (!Number.isFinite(num) || num === 0) return "0";
  if (num < 0.000001) return raw;
  return num.toLocaleString("en-US", {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0
  });
}

export function parseTokenAmount(value: string, decimals: number): bigint {
  const trimmed = value.trim();
  if (!trimmed || trimmed === ".") return 0n;
  return parseUnits(trimmed, decimals);
}

export function formatAmountForInput(value: bigint, decimals: number): string {
  if (value === 0n) return "";
  const raw = formatUnits(value, decimals);
  return raw.includes(".") ? raw.replace(/\.?0+$/, "") || "0" : raw;
}

/** App Kit insan-okunur miktar formati (orn. "10.00") */
export function formatAmountForKit(amount: string): string {
  const n = Number(amount.trim());
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Gecerli bir miktar girin.");
  }
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(6);
}

export function sanitizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}
