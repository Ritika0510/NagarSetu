"use client";

import { WifiOff } from "lucide-react";

interface OfflineCardProps {
  message: string;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export function OfflineCard({ message, suggestions, onSuggestionClick }: OfflineCardProps) {
  return (
    <div
      className="relative rounded-card border-2 border-accent-500 bg-accent-50/40 p-4"
      role="alert"
      aria-label="Offline. Cached responses available."
    >
      <WifiOff aria-hidden="true" className="absolute left-4 top-4 h-5 w-5 text-amber-600" />
      <p className="ml-8 text-[15px] leading-[1.6] text-slate-900">{message}</p>
      {suggestions.length > 0 && (
        <div className="ml-8 mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-left text-sm text-slate-900 transition-colors duration-150 ease-out hover:border-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
