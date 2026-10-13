"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DEMO_MODE, getSessionId, sendChat } from "@/lib/api";
import type { ChatResponse, Language, Message } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { OfflineCard } from "./OfflineCard";

interface ChatPanelProps {
  /** per §10.2 */
  sessionId: string;
  language: Language;
  onChecklistUpdate: (response: ChatResponse) => void;
}

interface OutOfScopeCardProps {
  message: string;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

function OutOfScopeCard({
  message,
  suggestions,
  onSuggestionClick,
}: OutOfScopeCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 text-sm">
      <p className="text-foreground">{message}</p>
      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-full border px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const EXAMPLE_CHIPS: { label: string; message: string }[] = [
  { label: "Open a small shop", message: "I want to open a small shop in Chandigarh" },
  { label: "Get a new water connection", message: "I need a new water connection for my house" },
  { label: "Pay property tax", message: "How do I pay my property tax in Chandigarh?" },
];

export function ChatPanel({ sessionId, language, onChecklistUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // §14.2 disclaimer — always visible
  const DISCLAIMER = "Navigational aid. Verify with the official department.";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = useCallback(
    async (e?: FormEvent, presetMessage?: string) => {
      e?.preventDefault();
      const text = (presetMessage ?? input).trim();
      if (!text || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setError(null);
      setLoading(true);

      try {
        const response = await sendChat({
          session_id: sessionId,
          message: text,
          language,
        });

        // Task 2: refusal path — render OutOfScopeCard, no checklist
        if (response.refusal === true) {
          const refusalMsg: Message = {
            id: `r-${Date.now()}`,
            role: "assistant",
            text: response.message ?? "That request is outside what I can help with.",
            refusal: {
              message: response.message ?? "",
              suggestions: response.suggestions ?? [],
            },
          };
          setMessages((prev) => [...prev, refusalMsg]);
          return; // no checklist update, no error
        }

                // Task 4: structured offline error — returned, not thrown.
        if ("error" in response && response.error === true) {
          const offlineMsg: Message = {
            id: `o-${Date.now()}`,
            role: "assistant",
            text: response.message,
            offline: {
              message: response.message,
              suggestions: response.suggestions ?? [],
            },
          };
          setMessages((prev) => [...prev, offlineMsg]);
          return;
        }

        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: response.assistant_message,
          checklist: response.checklist,
          sources: response.sources,
          lowConfidence: response.low_confidence,
          demoMode: response.demo_mode ?? DEMO_MODE,
          cachedOffline: "_offline_fallback" in response && response._offline_fallback === true,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        onChecklistUpdate(response); // §10.2: parent renders the checklist
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Something went wrong.";
        setError(detail);
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            text: "Sorry, I couldn't process that request. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, sessionId, language, onChecklistUpdate]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mt-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Describe what you need to do
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              For example, &ldquo;I want to open a small shop in
              Chandigarh&rdquo; — and I&apos;ll build your step-by-step
              checklist.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {EXAMPLE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleSubmit(undefined, chip.message)}
                  className="rounded-full border bg-card px-4 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.refusal ? (
            <OutOfScopeCard
              key={m.id}
              message={m.refusal.message}
              suggestions={m.refusal.suggestions}
              onSuggestionClick={(s) => {
                setInput(s);
                handleSubmit(undefined, s);
              }}
            />
          ) : m.offline ? (
            <OfflineCard
              key={m.id}
              message={m.offline.message}
              suggestions={m.offline.suggestions}
              onSuggestionClick={(s) => {
                setInput(s);
                handleSubmit(undefined, s);
              }}
            />
          ) : (
            <MessageBubble key={m.id} message={m} />
          )
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Building your checklist…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className={cn("border-t bg-card p-4")}
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you need to do…"
            disabled={loading}
            aria-label="Describe what you need to do"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {DISCLAIMER}
        </p>
      </form>
    </div>
  );
}