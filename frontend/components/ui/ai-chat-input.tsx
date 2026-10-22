"use client";

import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function PromptInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Describe what you need to do...",
  className,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const height = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${Math.max(height, 24)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 160 ? "auto" : "hidden";
  }, [value]);

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors focus-within:border-brand-700/40 focus-within:ring-2 focus-within:ring-brand-700/10",
        disabled && "opacity-70",
        className
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder={placeholder}
        aria-label="Describe what you need to do"
        disabled={disabled}
        rows={1}
        className="block max-h-40 min-h-12 w-full resize-none bg-transparent px-4 pb-2 pt-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
      />
      <div className="flex items-center justify-between gap-3 px-3 pb-2">
        <p className="text-[11px] text-slate-500">NagarSetu · Civic services</p>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send chat message"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white transition-colors hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowUp aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
