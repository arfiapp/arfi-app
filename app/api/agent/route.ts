/**
 * POST /api/agent
 *
 * Body: { message: string, walletAddress: string }
 *
 * Uses Groq (llama-3.3-70b-versatile) to parse natural language into a
 * structured swap intent, then returns the parsed action for the client
 * to execute. The actual swap is executed client-side (browser wallet).
 *
 * Groq free tier: 30 req/min, 14,400 req/day — no card required.
 * Key format: gsk_... — get from console.groq.com
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// ── Types ─────────────────────────────────────────────────────────────────────

type SupportedToken = "USDC" | "EURC" | "cirBTC";

type AgentResponse =
  | { action: "swap"; tokenIn: SupportedToken; tokenOut: SupportedToken; amount: string; message: string }
  | { action: "info"; message: string }
  | { action: "error"; message: string };

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the DeFi assistant of arfi.finance, running on Arc Testnet.

Supported tokens: USDC, EURC, cirBTC

Analyze the user's message and respond ONLY in the following JSON format:
{
  "action": "swap" | "info",
  "tokenIn": "USDC" | "EURC" | "cirBTC",
  "tokenOut": "USDC" | "EURC" | "cirBTC",
  "amount": "string",
  "message": "short explanation to show the user"
}

Rules:
- If the user wants to swap/exchange/trade: set action to "swap"
- If the user is asking for information: set action to "info", leave tokenIn/tokenOut/amount empty strings
- amount must always be a positive number string ("1.5" not "1,5")
- tokenIn and tokenOut must never be the same
- For ambiguous amounts, use "1.00"
- message should be short and in the same language as the user's message
- For info questions about Arc Network: explain that Arc is Circle's Layer-1 blockchain with USDC as native gas token, testnet at chainId 5042002, RPC https://rpc.testnet.arc.network
- For "how to install/connect Arc Network": explain MetaMask setup: Network Name: Arc Testnet, RPC URL: https://rpc.testnet.arc.network, Chain ID: 5042002, Currency: USDC, Explorer: https://testnet.arcscan.app

Examples:
- "Swap 1 USDC to EURC" → {"action":"swap","tokenIn":"USDC","tokenOut":"EURC","amount":"1.00","message":"Swapping 1 USDC for EURC."}
- "What is ARC Network?" → {"action":"info","tokenIn":"","tokenOut":"","amount":"","message":"Arc is Circle's Layer-1 blockchain where USDC is the native gas token. It offers sub-second finality and supports USDC, EURC, and cirBTC natively. Testnet Chain ID: 5042002."}
- "How can it be installed in ARC Network?" → {"action":"info","tokenIn":"","tokenOut":"","amount":"","message":"To connect MetaMask to Arc Testnet: Network Name: Arc Testnet | RPC URL: https://rpc.testnet.arc.network | Chain ID: 5042002 | Currency: USDC | Explorer: https://testnet.arcscan.app"}

Write nothing outside the JSON. Do not use markdown code blocks or backticks.`;

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<AgentResponse>> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { action: "error", message: "GROQ_API_KEY is missing. Add it to .env.local." },
      { status: 500 }
    );
  }

  let body: { message?: string; walletAddress?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { action: "error", message: "Invalid request format." },
      { status: 400 }
    );
  }

  const userMessage = body.message?.trim();
  if (!userMessage) {
    return NextResponse.json(
      { action: "error", message: "Message cannot be empty." },
      { status: 400 }
    );
  }

  try {
    const groq = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      temperature: 0.1,
      max_tokens:  500,
    });

    const raw  = completion.choices[0]?.message?.content ?? "";
    const text = raw.trim().replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[agent] JSON parse failed. Raw:", text);
      // Fallback: return as info message
      return NextResponse.json({ action: "info", message: text || "Could not parse response." });
    }

    const action = parsed.action as string;

    if (action === "swap") {
      const validTokens: SupportedToken[] = ["USDC", "EURC", "cirBTC"];
      const tokenIn  = parsed.tokenIn  as SupportedToken;
      const tokenOut = parsed.tokenOut as SupportedToken;
      const amount   = String(parsed.amount ?? "").replace(",", ".");

      if (!validTokens.includes(tokenIn) || !validTokens.includes(tokenOut)) {
        return NextResponse.json({
          action: "error",
          message: `Invalid token. Only ${validTokens.join(", ")} are supported.`,
        });
      }
      if (tokenIn === tokenOut) {
        return NextResponse.json({
          action: "error",
          message: "Source and destination token cannot be the same.",
        });
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return NextResponse.json({
          action: "error",
          message: "Invalid amount. Please enter a positive number.",
        });
      }

      return NextResponse.json({
        action:  "swap",
        tokenIn,
        tokenOut,
        amount,
        message: String(parsed.message ?? `${amount} ${tokenIn} → ${tokenOut} swap ready.`),
      });
    }

    // action === "info" or anything else
    return NextResponse.json({
      action:  "info",
      message: String(parsed.message ?? "How can I help you?"),
    });

  } catch (e) {
    console.error("[agent] Groq error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { action: "error", message: `AI error: ${msg.slice(0, 120)}` },
      { status: 500 }
    );
  }
}
