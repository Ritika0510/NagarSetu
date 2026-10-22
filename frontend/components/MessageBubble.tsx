"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
}

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

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div
          aria-hidden="true"
          className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-brand-50 text-brand-700"
        >
          <BridgeMark className="h-3.5 w-3.5" />
        </div>
      )}

      <div
        className={cn(
          "min-w-0 break-words px-4 py-3 text-[15px] leading-6",
          isUser
            ? "max-w-[70%] rounded-[16px_16px_4px_16px] bg-brand-700 text-white"
            : "max-w-[80%] rounded-[16px_16px_16px_4px] border border-slate-200 bg-white text-slate-900"
        )}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>

        {message.lowConfidence && (
          <div
            role="note"
            className="mt-3 flex items-start gap-2 rounded-lg border border-accent-500/40 bg-accent-50 px-3 py-2 text-xs leading-normal text-slate-700"
          >
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
            />
            <span>
              Some steps could not be verified against official sources.
              Please confirm with the department.
            </span>
          </div>
        )}

        {message.demoMode && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-chip bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              Demo Mode
            </span>
            {message.cachedOffline && (
              <span className="inline-block rounded-chip bg-accent-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Cached response (offline)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
