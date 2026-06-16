"use client";

import { useCallback, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Bot, Send, Loader2, ArrowLeftRight } from "lucide-react";
import { useSwapAdapter } from "@/hooks/useSwapAdapter";
import { estimateSwap, executeSwap } from "@/lib/swap";
import type { SwapTokenSymbol } from "@/lib/tokens";

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentAction =
  | { action: "swap"; tokenIn: SwapTokenSymbol; tokenOut: SwapTokenSymbol; amount: string; message: string }
  | { action: "info"; message: string }
  | { action: "error"; message: string };

type Message = {
  id: number;
  role: "user" | "agent" | "system";
  content: string;
  status?: "pending" | "success" | "error";
};

// ── Example prompts ───────────────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  "Swap 1 USDC to EURC",
  "Swap 2 USDC to cirBTC",
  "How can it be installed in ARC Network?",
  "What is ARC Network?",
];

// ── Component ─────────────────────────────────────────────────────────────────

let msgId = 0;
function nextId() { return ++msgId; }

export default function AgentPage() {
  const { isConnected, address } = useAccount();
  const { provider, isReady }    = useSwapAdapter();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: "agent",
      content: "Hi! I'm the arfi.finance AI Assistant. You can give me swap instructions in natural language. e.g. \"Swap 1 USDC to EURC\"",
    },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    const m = { ...msg, id: nextId() };
    setMessages(prev => [...prev, m]);
    scrollToBottom();
    return m.id;
  }, [scrollToBottom]);

  const updateMessage = useCallback((id: number, patch: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);

  // ── Send handler ────────────────────────────────────────────────────────────

  const handleSend = useCallback(async (text: string) => {
    const userText = text.trim();
    if (!userText || loading) return;

    setInput("");
    setLoading(true);

    // Add user bubble
    addMessage({ role: "user", content: userText });

    // Thinking indicator
    const thinkId = addMessage({ role: "agent", content: "...", status: "pending" });

    try {
      // ── Step 1: Ask AI ──────────────────────────────────────────────────────
      const res = await fetch("/api/agent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, walletAddress: address ?? "" }),
      });

      const data: AgentAction = await res.json();

      if (data.action === "error") {
        updateMessage(thinkId, { content: `❌ ${data.message}`, status: "error" });
        return;
      }

      if (data.action === "info") {
        updateMessage(thinkId, { content: data.message, status: undefined });
        return;
      }

      // ── Step 2: Swap action ─────────────────────────────────────────────────
      updateMessage(thinkId, { content: `🔄 ${data.message}` });

      if (!isConnected || !isReady || !provider || !address) {
        updateMessage(thinkId, {
          content: "❌ Swap için cüzdanını bağla ve Arc Testnet'te olduğundan emin ol.",
          status: "error",
        });
        return;
      }

      // Show quote first
      try {
        const estimate = await estimateSwap({
          provider,
          address,
          tokenIn:    data.tokenIn,
          tokenOut:   data.tokenOut,
          amountIn:   data.amount,
          slippageBps: 1000, // 10%
        });

        updateMessage(thinkId, {
          content: `🔄 Tahmini çıktı: ${estimate.amountOut} ${data.tokenOut}. MetaMask'ta işlemi onayla…`,
        });
      } catch {
        // Quote failed — continue anyway
      }

      // Execute swap
      const result = await executeSwap({
        provider,
        address,
        tokenIn:    data.tokenIn,
        tokenOut:   data.tokenOut,
        amountIn:   data.amount,
        slippageBps: 1000,
      });

      const txLink = `https://testnet.arcscan.app/tx/${result.transactionHash}`;
      updateMessage(thinkId, {
        content:  `✅ ${data.amount} ${data.tokenIn} → ${result.amountOut || "?"} ${data.tokenOut} swap edildi!\n🔗 [ArcScan](${txLink})`,
        status:   "success",
      });

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
      const short = msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
      updateMessage(thinkId, {
        content: `❌ İşlem başarısız: ${short}`,
        status:  "error",
      });
    } finally {
      setLoading(false);
    }
  }, [loading, address, isConnected, isReady, provider, addMessage, updateMessage]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>

        {/* Header */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
            >
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-textPrimary">AI Agent</h1>
              <p className="text-xs" style={{ color: "rgba(192,132,252,0.5)" }}>
                Swap in natural language · e.g. &quot;Swap 1 USDC to EURC&quot;
              </p>
            </div>
          </div>

          {/* Connect wallet warning */}
          {!isConnected && (
            <div className="mt-3 flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs text-amber-300">Connect your wallet to execute swaps.</p>
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) =>
                  mounted ? (
                    <button type="button" onClick={openConnectModal} className="wallet-btn-primary text-xs px-3 py-1.5">
                      Connect
                    </button>
                  ) : null
                }
              </ConnectButton.Custom>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div
          className="flex-1 overflow-y-auto space-y-3 rounded-2xl p-4 mb-3"
          style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(168,85,247,0.12)" }}
        >
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Agent avatar */}
              {msg.role === "agent" && (
                <div
                  className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(168,85,247,0.2)" }}
                >
                  <Bot className="h-3.5 w-3.5" style={{ color: "#a855f7" }} />
                </div>
              )}

              <div
                className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                style={
                  msg.role === "user"
                    ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff" }
                    : msg.status === "error"
                    ? { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }
                    : msg.status === "success"
                    ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#86efac" }
                    : { background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.15)", color: "rgba(243,232,255,0.9)" }
                }
              >
                {msg.status === "pending" ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Düşünüyor…</span>
                  </span>
                ) : (
                  // Render [text](url) as links
                  msg.content.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                    const match = part.match(/\[(.*?)\]\((.*?)\)/);
                    if (match) {
                      return (
                        <a key={i} href={match[2]} target="_blank" rel="noreferrer"
                          className="underline hover:opacity-80">
                          {match[1]}
                        </a>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Example prompts */}
        <div className="mb-3 flex flex-wrap gap-2 shrink-0">
          {EXAMPLE_PROMPTS.map(p => (
            <button
              key={p}
              type="button"
              disabled={loading}
              onClick={() => void handleSend(p)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition"
              style={{
                background: "rgba(168,85,247,0.08)",
                border: "1px solid rgba(168,85,247,0.2)",
                color: "rgba(192,132,252,0.7)",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 shrink-0"
          style={{ background: "rgba(30,0,55,0.75)", border: "1px solid rgba(168,85,247,0.2)" }}
        >
          <ArrowLeftRight className="h-4 w-4 shrink-0" style={{ color: "rgba(168,85,247,0.5)" }} />
          <input
            type="text"
            placeholder="e.g. Swap 1 USDC to EURC…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(input); } }}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => void handleSend(input)}
            disabled={loading || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin text-white" />
              : <Send className="h-4 w-4 text-white" />
            }
          </button>
        </div>
      </div>
    </main>
  );
}
