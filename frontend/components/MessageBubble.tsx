"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground border"
        )}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>

        {message.lowConfidence && (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-slate-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <span>
              Some steps could not be verified against official sources.
              Please confirm with the department.
            </span>
          </div>
        )}

        {message.demoMode && (
          <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            Demo Mode
          {message.cachedOffline && (
          <span className="mt-2 inline-block rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Cached response (offline)
          </span>
        )}
          </span>
        )}
      </div>
    </div>
  );
}