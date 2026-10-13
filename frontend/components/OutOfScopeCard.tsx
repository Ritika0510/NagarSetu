"use client";

import { Info } from "lucide-react";

interface OutOfScopeCardProps {
  message: string;
  suggestions: string[];
  onSuggestionClick: (s: string) => void;
}

export function OutOfScopeCard({ message, suggestions, onSuggestionClick }: OutOfScopeCardProps) {
  return (
    <div
      className="rounded-xl border-2 border-warning bg-warning/5 p-4"
      role="alert"
      aria-label="Query out of scope"
    >
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-medium text-foreground">{message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestionClick(s)}
                className="rounded-full border border-warning/40 bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:border-warning hover:bg-warning/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}