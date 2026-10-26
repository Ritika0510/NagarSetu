"use client";

import { ExternalLink, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SourceRef } from "@/lib/types";

interface SourcePopoverProps {
  chunkId: string;
  sources: SourceRef[];
}

export function SourcePopover({ chunkId, sources }: SourcePopoverProps) {
  const source = sources.find((s) => s.chunk_id === chunkId);
  if (!source) {
    return <span className="text-[11px] text-slate-500">[{chunkId}]</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors duration-150 ease-out hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <FileText aria-hidden="true" className="h-3 w-3" />
          Source
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-left">
        <p className="text-xs leading-relaxed text-slate-700">{source.snippet}</p>
        <p className="mt-2 text-[11px] text-slate-500">{source.chunk_id}</p>
        {source.source_url && source.source_url !== "MOCK" ? (
          <a
            href={source.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
          >
            Open official document
            <ExternalLink aria-hidden="true" className="h-3 w-3" />
          </a>
        ) : (
          <p className="mt-2 text-[11px] italic text-slate-500">
            Mock source (official doc unavailable at build time)
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
