// "use client";

// import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
// import { ArrowRight, Send } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { DEMO_MODE, sendChat } from "@/lib/api";
// import type { ChatResponse, Language, Message } from "@/lib/types";
// import { cn } from "@/lib/utils";
// import { MessageBubble } from "./MessageBubble";
// import { OfflineCard } from "./OfflineCard";
// import { OutOfScopeCard } from "./OutOfScopeCard";

// interface ChatPanelProps {
//   sessionId: string;
//   language: Language;
//   onChecklistUpdate: (response: ChatResponse) => void;
// }

// const EXAMPLE_CHIPS: Array<{ label: string; message: string }> = [
//   { label: "Open a small shop", message: "I want to open a small shop in Chandigarh" },
//   { label: "Get a water connection", message: "I need a new water connection for my house" },
//   { label: "Pay property tax", message: "How do I pay my property tax in Chandigarh?" },
// ];

// function BridgeMark({ className }: { className?: string }) {
//   return (
//     <svg viewBox="0 0 72 72" aria-hidden="true" className={className}>
//       <path
//         d="M10 28.5c0-7.5 6-13.5 13.5-13.5H31a7.5 7.5 0 0 1 7.5 7.5v7.5c0 5.8-4.7 10.5-10.5 10.5H19c-2 0-3.5 1.5-3.5 3.5V54h-5.5V28.5Zm14.5 17.5h9.5c4.8 0 8.6-3.8 8.6-8.5v-8.2A8.6 8.6 0 0 0 33.5 20h-7.3c-4.1 0-7.4 3.3-7.4 7.4v3.1h7.2c1.7 0 3 1.3 3 3v10.5Z"
//         fill="currentColor"
//       />
//       <path d="M42 21h18v5H42zm0 11h18v5H42zm0 11h18v5H42z" fill="currentColor" opacity="0.9"/>
//     </svg>
//   );
// }

// export function ChatPanel({ sessionId, language, onChecklistUpdate }: ChatPanelProps) {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const bottomRef = useRef<HTMLDivElement>(null);

//   const DISCLAIMER = "Navigational aid. Verify with the official department.";

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, loading]);

//   const handleSubmit = useCallback(
//     async (event?: FormEvent, presetMessage?: string) => {
//       event?.preventDefault();
//       const text = (presetMessage ?? input).trim();
//       if (!text || loading) return;

//       const userMsg: Message = {
//         id: `u-${Date.now()}`,
//         role: "user",
//         text,
//       };
//       setMessages((previous) => [...previous, userMsg]);
//       setInput("");
//       setError(null);
//       setLoading(true);

//       try {
//         const response = await sendChat({
//           session_id: sessionId,
//           message: text,
//           language,
//         });

//         if ("refusal" in response && response.refusal === true) {
//           const refusalMsg: Message = {
//             id: `r-${Date.now()}`,
//             role: "assistant",
//             text: response.message ?? "That request is outside what I can help with.",
//             refusal: {
//               message: response.message ?? "",
//               suggestions: response.suggestions ?? [],
//             },
//           };
//           setMessages((previous) => [...previous, refusalMsg]);
//           return;
//         }

//         if ("error" in response && response.error === true) {
//           const offlineMsg: Message = {
//             id: `o-${Date.now()}`,
//             role: "assistant",
//             text: response.message,
//             offline: {
//               message: response.message,
//               suggestions: response.suggestions ?? [],
//             },
//           };
//           setMessages((previous) => [...previous, offlineMsg]);
//           return;
//         }

//         if (!("assistant_message" in response)) {
//           setError("Unexpected response shape from the server.");
//           return;
//         }

//         const assistantMsg: Message = {
//           id: `a-${Date.now()}`,
//           role: "assistant",
//           text: response.assistant_message,
//           checklist: response.checklist,
//           sources: response.sources,
//           lowConfidence: response.low_confidence,
//           demoMode: response.demo_mode ?? DEMO_MODE,
//           cachedOffline: "_offline_fallback" in response && response._offline_fallback === true,
//         };
//         setMessages((previous) => [...previous, assistantMsg]);
//         onChecklistUpdate(response);
//       } catch (caughtError) {
//         const detail = caughtError instanceof Error ? caughtError.message : "Something went wrong.";
//         setError(detail);
//         setMessages((previous) => [
//           ...previous,
//           {
//             id: `e-${Date.now()}`,
//             role: "assistant",
//             text: "Sorry, I couldn't process that request. Please try again.",
//           },
//         ]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [input, loading, language, onChecklistUpdate, sessionId]
//   );

//   return (
//     <div className="flex h-full flex-col bg-white">
//       <div className="flex-1 space-y-4 overflow-y-auto p-4">
//         {messages.length === 0 && (
//           <div className="mt-8 flex h-full flex-col items-center justify-center text-center">
//             <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100/80 text-brand-700/20">
//               <BridgeMark className="h-16 w-16" />
//             </div>
//             <h2 className="text-[22px] font-bold text-slate-900">
//               Where do you want to start?
//             </h2>
//             <p className="mt-3 max-w-md text-base leading-7 text-slate-600">
//               Type a government procedure.
//               We&apos;ll build the checklist.
//             </p>
//             <div className="mt-6 flex flex-wrap justify-center gap-3">
//               {EXAMPLE_CHIPS.map((chip) => (
//                 <button
//                   key={chip.label}
//                   type="button"
//                   onClick={() => handleSubmit(undefined, chip.message)}
//                   className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-all duration-150 ease-out hover:border-brand-700 hover:bg-brand-50"
//                 >
//                   {chip.label}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {messages.map((message) =>
//           message.refusal ? (
//             <OutOfScopeCard
//               key={message.id}
//               message={message.refusal.message}
//               suggestions={message.refusal.suggestions}
//               onSuggestionClick={(suggestion) => {
//                 setInput(suggestion);
//                 handleSubmit(undefined, suggestion);
//               }}
//             />
//           ) : message.offline ? (
//             <OfflineCard
//               key={message.id}
//               message={message.offline.message}
//               suggestions={message.offline.suggestions}
//               onSuggestionClick={(suggestion) => {
//                 setInput(suggestion);
//                 handleSubmit(undefined, suggestion);
//               }}
//             />
//           ) : (
//             <MessageBubble key={message.id} message={message} />
//           )
//         )}

//         {loading && (
//           <div className="flex justify-start">
//             <div className="max-w-[80%] rounded-[16px_16px_16px_4px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
//               <div className="flex items-center gap-2 pt-1">
//                 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
//                   <BridgeMark className="h-4 w-4" />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {[0, 1, 2].map((index) => (
//                     <span
//                       key={index}
//                       className={cn(
//                         "block h-2.5 w-2.5 rounded-full bg-slate-400 animate-pulse-slow",
//                         index === 1 && "animation-delay-150",
//                         index === 2 && "animation-delay-300"
//                       )}
//                       style={{ animationDelay: `${index * 200}ms` }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         <div ref={bottomRef} />
//       </div>

//       {error && (
//         <div className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
//           {error}
//         </div>
//       )}

//       <form onSubmit={handleSubmit} className={cn("border-t border-slate-100 bg-white p-4")}>
//         <div className="flex gap-2">
//           <Input
//             value={input}
//             onChange={(event) => setInput(event.target.value)}
//             placeholder="Describe what you need to do…"
//             disabled={loading}
//             aria-label="Describe what you need to do"
//             className="h-11 rounded-lg border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-brand-700"
//           />
//           <Button
//             type="submit"
//             disabled={loading || !input.trim()}
//             size="icon"
//             className="h-11 w-11 rounded-lg bg-brand-700 text-white hover:bg-brand-900"
//             aria-label="Send chat message"
//           >
//             <Send className="h-4 w-4" />
//           </Button>
//         </div>
//         <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
//           <span>{DISCLAIMER}</span>
//           <ArrowRight className="h-3 w-3" />
//         </div>
//       </form>
//     </div>
//   );
// }


"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { DEMO_MODE, sendChat } from "@/lib/api";
import type { ChatResponse, Language, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PromptInput } from "@/components/ui/ai-chat-input";
import { MessageBubble } from "./MessageBubble";
import { OfflineCard } from "./OfflineCard";
import { OutOfScopeCard } from "./OutOfScopeCard";

interface ChatPanelProps {
  sessionId: string;
  language: Language;
  onChecklistUpdate: (response: ChatResponse) => void;
}

const DISCLAIMER = "Navigational aid. Verify with the official department.";

const EXAMPLE_CHIPS: Array<{ label: string; message: string }> = [
  { label: "Open a small shop", message: "I want to open a small shop in Chandigarh" },
  { label: "Get a water connection", message: "I need a new water connection for my house" },
  { label: "Pay property tax", message: "How do I pay my property tax in Chandigarh?" },
];

// Staggered start for the three typing dots (1.4s cycle is set by animate-dot).
const DOT_DELAYS: string[] = ["", "[animation-delay:200ms]", "[animation-delay:400ms]"];

function BridgeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" className={className}>
      <path
        d="M10 28.5c0-7.5 6-13.5 13.5-13.5H31a7.5 7.5 0 0 1 7.5 7.5v7.5c0 5.8-4.7 10.5-10.5 10.5H19c-2 0-3.5 1.5-3.5 3.5V54h-5.5V28.5Zm14.5 17.5h9.5c4.8 0 8.6-3.8 8.6-8.5v-8.2A8.6 8.6 0 0 0 33.5 20h-7.3c-4.1 0-7.4 3.3-7.4 7.4v3.1h7.2c1.7 0 3 1.3 3 3v10.5Z"
        fill="currentColor"
      />
      <path d="M42 21h18v5H42zm0 11h18v5H42zm0 11h18v5H42z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export function ChatPanel({ sessionId, language, onChecklistUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = useCallback(
    async (event?: FormEvent, presetMessage?: string) => {
      event?.preventDefault();
      const text = (presetMessage ?? input).trim();
      if (!text || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        text,
      };
      setMessages((previous) => [...previous, userMsg]);
      setInput("");
      setError(null);
      setLoading(true);

      try {
        const response = await sendChat({
          session_id: sessionId,
          message: text,
          language,
        });

        if ("refusal" in response && response.refusal === true) {
          const refusalMsg: Message = {
            id: `r-${Date.now()}`,
            role: "assistant",
            text: response.message ?? "That request is outside what I can help with.",
            refusal: {
              message: response.message ?? "",
              suggestions: response.suggestions ?? [],
            },
          };
          setMessages((previous) => [...previous, refusalMsg]);
          return;
        }

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
          setMessages((previous) => [...previous, offlineMsg]);
          return;
        }

        if (!("assistant_message" in response)) {
          setError("Unexpected response shape from the server.");
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
        setMessages((previous) => [...previous, assistantMsg]);
        onChecklistUpdate(response);
      } catch (caughtError) {
        const detail = caughtError instanceof Error ? caughtError.message : "Something went wrong.";
        setError(detail);
        setMessages((previous) => [
          ...previous,
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
    [input, loading, language, onChecklistUpdate, sessionId]
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <div className="flex min-h-full flex-col items-center justify-center py-8 text-center">
            <BridgeMark className="h-20 w-20 text-brand-700/20" />
            <h2 className="mt-6 text-[22px] font-bold text-slate-900">
              Where do you want to start?
            </h2>
            <p className="mt-3 max-w-md text-base leading-[1.6] text-slate-600">
              Type a government procedure.
              <br />
              We&apos;ll build the checklist.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {EXAMPLE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => void handleSubmit(undefined, chip.message)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm text-slate-900 transition-colors duration-150 ease-out hover:border-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  {chip.label}
                  <ArrowRight aria-hidden="true" className="h-4 w-4 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) =>
          message.refusal ? (
            <div key={message.id} className="animate-enter">
              <OutOfScopeCard
                message={message.refusal.message}
                suggestions={message.refusal.suggestions}
                onSuggestionClick={(suggestion) => {
                  void handleSubmit(undefined, suggestion);
                }}
              />
            </div>
          ) : message.offline ? (
            <div key={message.id} className="animate-enter">
              <OfflineCard
                message={message.offline.message}
                suggestions={message.offline.suggestions}
                onSuggestionClick={(suggestion) => {
                  void handleSubmit(undefined, suggestion);
                }}
              />
            </div>
          ) : (
            <div key={message.id} className="animate-enter">
              <MessageBubble message={message} />
            </div>
          )
        )}

        {loading && (
          <div
            role="status"
            aria-label="NagarSetu is typing"
            className="flex animate-enter justify-start"
          >
            <div className="flex items-center gap-3 rounded-[16px_16px_16px_4px] border border-slate-200 bg-white px-4 py-3">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"
              >
                <BridgeMark className="h-3.5 w-3.5" />
              </span>
              <span aria-hidden="true" className="flex items-center gap-1.5">
                {DOT_DELAYS.map((delay, index) => (
                  <span
                    key={index}
                    className={cn("block h-1.5 w-1.5 animate-dot rounded-full bg-slate-400", delay)}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div role="alert" className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-4">
        <PromptInput
          value={input}
          onChange={setInput}
          placeholder="Describe what you need to do..."
          disabled={loading}
        />
        <p className="mt-2 text-center text-[11px] text-slate-500">{DISCLAIMER}</p>
      </form>
    </div>
  );
}