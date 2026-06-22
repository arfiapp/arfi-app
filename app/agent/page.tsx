"use client";

import { useCallback, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Bot, Send, Loader2, ArrowRight, X } from "lucide-react";
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
  role: "user" | "agent";
  content: string;
  status?: "pending" | "success" | "error";
  swapPreview?: SwapPreviewData | null;
};

type SwapPreviewData = {
  tokenIn: SwapTokenSymbol;
  tokenOut: SwapTokenSymbol;
  amount: string;
  amountOut: string;
  slippage: string;
};

// ── Example prompts ───────────────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  "Swap 1 USDC to EURC",
  "Swap 2 USDC to cirBTC",
  "What is ARC Network?",
];

// ── Swap Preview Card ─────────────────────────────────────────────────────────

function SwapPreviewCard({
  preview,
  onConfirm,
  onCancel,
  loading,
}: {
  preview: SwapPreviewData;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="mt-3 rounded-2xl overflow-hidden"
      style={{ background: "rgba(20,0,40,0.95)", border: "1px solid rgba(168,85,247,0.35)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(168,85,247,0.15)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded"
            style={{ background: "rgba(168,85,247,0.25)" }}>
            <ArrowRight className="h-3 w-3" style={{ color: "#a855f7" }} />
          </div>
          <span className="text-sm font-semibold text-textPrimary">Swap Preview</span>
        </div>
        <button type="button" onClick={onCancel}
          className="rounded-lg p-1 transition hover:bg-white/5"
          style={{ color: "rgba(192,132,252,0.5)" }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* You pay / You receive */}
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 rounded-xl px-4 py-3 text-center"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(168,85,247,0.1)" }}>
          <p className="text-xs mb-1" style={{ color: "rgba(192,132,252,0.5)" }}>You pay</p>
          <p className="text-lg font-bold text-textPrimary">{preview.amount} {preview.tokenIn}</p>
        </div>

        <ArrowRight className="h-5 w-5 shrink-0" style={{ color: "rgba(168,85,247,0.6)" }} />

        <div className="flex-1 rounded-xl px-4 py-3 text-center"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(168,85,247,0.1)" }}>
          <p className="text-xs mb-1" style={{ color: "rgba(192,132,252,0.5)" }}>You receive</p>
          <p className="text-lg font-bold" style={{ color: "#a855f7" }}>
            ≈{preview.amountOut} {preview.tokenOut}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span style={{ color: "rgba(192,132,252,0.5)" }}>Best route</span>
          <span style={{ color: "rgba(192,132,252,0.8)" }}>XyloNet DEX</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: "rgba(192,132,252,0.5)" }}>Slippage</span>
          <span style={{ color: "rgba(192,132,252,0.8)" }}>{preview.slippage}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: "rgba(192,132,252,0.5)" }}>Network</span>
          <span style={{ color: "rgba(192,132,252,0.8)" }}>Arc Testnet</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition"
          style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "rgba(192,132,252,0.8)" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 20px rgba(168,85,247,0.35)" }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Confirming…" : "Confirm Swap"}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

let msgId = 0;
function nextId() { return ++msgId; }

export default function AgentPage() {
  const { isConnected, address } = useAccount();
  const { provider, isReady }    = useSwapAdapter();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: "agent",
      content: "Hi! I'm the arfi.finance AI Assistant. You can give me swap instructions in natural language.\n\nTry: \"Swap 1 USDC to EURC\"",
    },
  ]);
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  // pending swap waiting for user confirmation
  const [pendingSwap, setPendingSwap]     = useState<(SwapPreviewData & { msgId: number }) | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
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

  // ── Confirm swap ──────────────────────────────────────────────────────────

  const handleConfirmSwap = useCallback(async () => {
    if (!pendingSwap || !provider || !address) return;

    setConfirmLoading(true);
    const { msgId: agentMsgId, ...swapData } = pendingSwap;

    // Remove preview card, show processing
    updateMessage(agentMsgId, { swapPreview: null, content: "⏳ Processing swap… Confirm in MetaMask." });
    setPendingSwap(null);

    try {
      const result = await executeSwap({
        provider,
        address,
        tokenIn:    swapData.tokenIn,
        tokenOut:   swapData.tokenOut,
        amountIn:   swapData.amount,
        slippageBps: 1000,
      });

      const txLink = `https://testnet.arcscan.app/tx/${result.transactionHash}`;
      updateMessage(agentMsgId, {
        content: `✅ Swap complete! ${swapData.amount} ${swapData.tokenIn} → ${result.amountOut || swapData.amountOut} ${swapData.tokenOut}\n🔗 [View on ArcScan](${txLink})`,
        status:  "success",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      updateMessage(agentMsgId, {
        content: `❌ Swap failed: ${msg.slice(0, 120)}`,
        status:  "error",
      });
    } finally {
      setConfirmLoading(false);
    }
  }, [pendingSwap, provider, address, updateMessage]);

  const handleCancelSwap = useCallback(() => {
    if (!pendingSwap) return;
    updateMessage(pendingSwap.msgId, { swapPreview: null, content: "Swap cancelled." });
    setPendingSwap(null);
  }, [pendingSwap, updateMessage]);

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(async (text: string) => {
    const userText = text.trim();
    if (!userText || loading) return;

    setInput("");
    setLoading(true);
    inputRef.current?.focus();

    addMessage({ role: "user", content: userText });
    const thinkId = addMessage({ role: "agent", content: "", status: "pending" });

    try {
      const res  = await fetch("/api/agent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: userText, walletAddress: address ?? "" }),
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

      // ── Swap action: get quote then show preview card ─────────────────────
      if (!isConnected || !isReady || !provider || !address) {
        updateMessage(thinkId, {
          content: "❌ Connect your wallet to Arc Testnet to execute swaps.",
          status:  "error",
        });
        return;
      }

      updateMessage(thinkId, { content: data.message, status: undefined });

      // Get quote
      let amountOut = "…";
      try {
        const est = await estimateSwap({
          provider, address,
          tokenIn:    data.tokenIn,
          tokenOut:   data.tokenOut,
          amountIn:   data.amount,
          slippageBps: 1000,
        });
        amountOut = Number(est.amountOut).toFixed(
          data.tokenOut === "cirBTC" ? 6 : 4
        );
      } catch { /* use placeholder */ }

      const preview: SwapPreviewData = {
        tokenIn:  data.tokenIn,
        tokenOut: data.tokenOut,
        amount:   data.amount,
        amountOut,
        slippage: "10%",
      };

      updateMessage(thinkId, { swapPreview: preview });
      setPendingSwap({ ...preview, msgId: thinkId });

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      updateMessage(thinkId, { content: `❌ AI error: ${msg.slice(0, 100)}`, status: "error" });
    } finally {
      setLoading(false);
    }
  }, [loading, address, isConnected, isReady, provider, addMessage, updateMessage]);

  // ── Render markdown-style links ───────────────────────────────────────────

  function renderContent(content: string) {
    return content.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a key={i} href={match[2]} target="_blank" rel="noreferrer"
            className="underline hover:opacity-80 transition-opacity">
            {match[1]}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <main
      className="flex flex-col px-4 py-6"
      style={{ maxWidth: 760, margin: "0 auto", height: "calc(100vh - 3.5rem)" }}
    >
      {/* Header */}
      <div className="shrink-0 mb-4">
        <h1 className="font-display text-3xl font-bold" style={{ color: "#a855f7" }}>
          AI Agent
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(192,132,252,0.5)" }}>
          Describe what you want to swap in plain language.
        </p>

        {!isConnected && (
          <div className="mt-3 flex items-center justify-between rounded-xl px-4 py-2.5"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p className="text-xs text-amber-300">Connect your wallet to execute swaps.</p>
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) =>
                mounted ? (
                  <button type="button" onClick={openConnectModal}
                    className="wallet-btn-primary text-xs px-3 py-1.5">
                    Connect
                  </button>
                ) : null
              }
            </ConnectButton.Custom>
          </div>
        )}
      </div>

      {/* Scrollable chat area */}
      <div
        className="flex-1 overflow-y-auto space-y-4 pr-1"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(168,85,247,0.3) transparent" }}
      >
        {messages.map(msg => (
          <div key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

            {msg.role === "agent" && (
              <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(168,85,247,0.2)" }}>
                <Bot className="h-3.5 w-3.5" style={{ color: "#a855f7" }} />
              </div>
            )}

            <div className="max-w-[85%]">
              {/* Bubble */}
              {(msg.status === "pending" || msg.content) && (
                <div
                  className="rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === "user"
                      ? { background: "rgba(124,58,237,0.8)", color: "#fff" }
                      : msg.status === "error"
                      ? { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }
                      : msg.status === "success"
                      ? { background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", color: "#86efac" }
                      : { background: "rgba(30,5,60,0.8)", border: "1px solid rgba(168,85,247,0.18)", color: "rgba(243,232,255,0.9)" }
                  }
                >
                  {msg.status === "pending"
                    ? <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span style={{ color: "rgba(192,132,252,0.6)" }}>Thinking…</span>
                      </span>
                    : renderContent(msg.content)
                  }
                </div>
              )}

              {/* Swap preview card */}
              {msg.swapPreview && pendingSwap?.msgId === msg.id && (
                <SwapPreviewCard
                  preview={msg.swapPreview}
                  onConfirm={handleConfirmSwap}
                  onCancel={handleCancelSwap}
                  loading={confirmLoading}
                />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Example prompts */}
      <div className="shrink-0 mt-3 mb-3 flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map(p => (
          <button key={p} type="button"
            disabled={loading}
            onClick={() => void handleSend(p)}
            className="rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-40"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "rgba(192,132,252,0.7)" }}>
            {p}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: "rgba(15,0,30,0.9)", border: "1px solid rgba(168,85,247,0.25)" }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask about swaps on Arc…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(input); } }}
          disabled={loading}
          className="flex-1 bg-transparent text-sm text-textPrimary outline-none placeholder:opacity-30"
        />
        <button
          type="button"
          onClick={() => void handleSend(input)}
          disabled={loading || !input.trim()}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </main>
  );
}
