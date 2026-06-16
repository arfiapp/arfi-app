/**
 * POST /api/agent
 *
 * Body: { message: string, walletAddress: string }
 *
 * Uses Gemini Flash to parse natural language into a structured swap intent,
 * then returns the parsed action for the client to execute.
 *
 * The actual swap is executed client-side (browser wallet signature required).
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
- If the user is asking for information (token list, what is Arc Network, how to install, etc.): set action to "info", leave tokenIn/tokenOut/amount empty
- amount must always be a positive number string ("1.5" not "1,5")
- tokenIn and tokenOut must never be the same
- For ambiguous amounts, use "1.00"
- message should be short and in the same language as the user's message
- For info questions about Arc Network: explain that Arc is Circle's Layer-1 blockchain with USDC as native gas token, testnet at chainId 5042002, RPC https://rpc.testnet.arc.network
- For "how to install/connect": explain MetaMask setup with chainId 5042002, currency USDC, explorer testnet.arcscan.app

Examples:
- "Swap 1 USDC to EURC" → {"action":"swap","tokenIn":"USDC","tokenOut":"EURC","amount":"1.00","message":"Swapping 1 USDC for EURC."}
- "What is ARC Network?" → {"action":"info","message":"Arc is Circle's Layer-1 blockchain where USDC is the native gas token. It offers sub-second finality and supports USDC, EURC, and cirBTC natively. Testnet Chain ID: 5042002."}
- "How can it be installed in ARC Network?" → {"action":"info","message":"To connect MetaMask to Arc Testnet: Network Name: Arc Testnet | RPC URL: https://rpc.testnet.arc.network | Chain ID: 5042002 | Currency: USDC | Explorer: https://testnet.arcscan.app"}
- "desteklenen tokenlar neler" → {"action":"info","message":"Desteklenen tokenlar: USDC, EURC ve cirBTC."}

Write nothing outside the JSON. Do not use markdown code blocks.`;

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<AgentResponse>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { action: "error", message: "GEMINI_API_KEY eksik. .env.local dosyasını kontrol edin." },
      { status: 500 }
    );
  }

  let body: { message?: string; walletAddress?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { action: "error", message: "Geçersiz istek formatı." },
      { status: 400 }
    );
  }

  const userMessage = body.message?.trim();
  if (!userMessage) {
    return NextResponse.json(
      { action: "error", message: "Mesaj boş olamaz." },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(userMessage);
    const text   = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[agent] JSON parse failed. Raw text:", text);
      return NextResponse.json({
        action: "error",
        message: "AI yanıtı işlenemedi. Lütfen tekrar deneyin.",
      });
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
          message: `Geçersiz token. Sadece ${validTokens.join(", ")} destekleniyor.`,
        });
      }

      if (tokenIn === tokenOut) {
        return NextResponse.json({
          action: "error",
          message: "Kaynak ve hedef token aynı olamaz.",
        });
      }

      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return NextResponse.json({
          action: "error",
          message: "Geçersiz miktar. Lütfen pozitif bir sayı girin.",
        });
      }

      return NextResponse.json({
        action:   "swap",
        tokenIn,
        tokenOut,
        amount,
        message:  String(parsed.message ?? `${amount} ${tokenIn} → ${tokenOut} swap hazır.`),
      });
    }

    if (action === "info") {
      return NextResponse.json({
        action:  "info",
        message: String(parsed.message ?? "Nasıl yardımcı olabilirim?"),
      });
    }

    return NextResponse.json({
      action:  "info",
      message: String(parsed.message ?? "Anlaşılamadı. Tekrar deneyin."),
    });

  } catch (e) {
    console.error("[agent] Gemini error:", e);
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json(
      { action: "error", message: `AI hatası: ${msg.slice(0, 100)}` },
      { status: 500 }
    );
  }
}
