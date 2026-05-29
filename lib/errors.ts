function extractMessage(error: unknown): string | undefined {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    // viem errors: shortMessage is the clean user-facing message
    if (typeof record.shortMessage === "string") return record.shortMessage;
    if (typeof record.message === "string") return record.message;
    if (typeof record.reason === "string") return record.reason;
  }
  return undefined;
}

function extractDetails(error: unknown): string {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    // viem ContractFunctionRevertedError has .data.errorName
    if (record.data && typeof record.data === "object") {
      const data = record.data as Record<string, unknown>;
      if (typeof data.errorName === "string") return data.errorName;
    }
    // nested cause
    if (record.cause) return extractMessage(record.cause) ?? "";
  }
  return "";
}

export function toUserMessage(error: unknown): string {
  // Always log the raw error so we can debug in the browser console
  console.error("[swap error]", error);

  const raw = extractMessage(error) ?? "";
  const details = extractDetails(error);
  const combined = `${raw} ${details}`.toLowerCase();

  if (!raw) return "An unexpected error occurred.";

  // ── User actions ──────────────────────────────────────────────────────────
  if (combined.includes("user rejected") || combined.includes("user denied") || combined.includes("rejected")) {
    return "Transaction was cancelled in the wallet.";
  }

  // ── Allowance / approval ──────────────────────────────────────────────────
  if (combined.includes("insufficient allowance") || combined.includes("erc20: insufficient allowance")) {
    return "Token approval missing. Please approve the token first, then swap.";
  }

  // ── Balance ───────────────────────────────────────────────────────────────
  if (combined.includes("insufficient balance") || combined.includes("exceeds balance") || combined.includes("transfer amount exceeds")) {
    return "Insufficient balance. Enter a smaller amount or get test tokens from faucet.circle.com.";
  }
  if (combined.includes("insufficient")) {
    return "Insufficient balance. Get test USDC/EURC from faucet.circle.com.";
  }

  // ── Slippage / price impact ───────────────────────────────────────────────
  if (combined.includes("minamountout") || combined.includes("slippage") || combined.includes("price impact") || combined.includes("too little received")) {
    return "Slippage too low — price moved. Increase slippage (Settings → try 2%) and retry.";
  }

  // ── Contract revert ───────────────────────────────────────────────────────
  if (combined.includes("execution reverted") || combined.includes("transaction reverted") || combined.includes("revert")) {
    return `Transaction reverted. Try a smaller amount or increase slippage to 2%. Details: ${raw.slice(0, 120)}`;
  }

  // ── Chain / network ───────────────────────────────────────────────────────
  if (combined.includes("chain") && (combined.includes("mismatch") || combined.includes("unsupported"))) {
    return "Wallet is not on Arc Testnet (5042002). Use the 'Switch to Arc Testnet' button above.";
  }

  // ── Network connectivity (keep this LAST and narrow) ─────────────────────
  if (combined.includes("failed to fetch") || combined.includes("network error") || combined.includes("connection refused")) {
    return "Network error. Check your internet connection and try again.";
  }
  if (combined.includes("timeout")) {
    return "Request timed out. The Arc RPC may be slow — please retry.";
  }

  // ── Fallback: show the raw message ────────────────────────────────────────
  return raw.length > 200 ? `${raw.slice(0, 200)}...` : raw;
}
