"use client";

import { FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SourceRef } from "@/lib/types";

interface SourcePopoverProps {
  chunkId: string;
  sources: SourceRef[];
}

export function SourcePopover({ chunkId, sources }: SourcePopoverProps) {
  const source = sources.find((s) => s.chunk_id === chunkId);
  if (!source) {
    return <span className="text-[11px] text-muted-foreground">[{chunkId}]</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20"
        >
          <FileText className="h-3 w-3" />
          Source
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-left">
        <p className="text-xs leading-relaxed text-foreground">{source.snippet}</p>
        <p className="mt-2 text-[10px] text-muted-foreground">{source.chunk_id}</p>
        {source.source_url && source.source_url !== "MOCK" ? (
          <a
            href={source.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
          >
            Open official document →
          </a>
        ) : (
          <p className="mt-2 text-[10px] italic text-muted-foreground">
            Mock source (official doc unavailable at build time)
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}