"use client";

import { useId, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChecklistStep, SourceRef } from "@/lib/types";
import { SourcePopover } from "./SourcePopover";

function FieldWarning({
  officialLink,
  sourceChunkIds,
  sources,
}: {
  officialLink: string;
  sourceChunkIds: string[];
  sources: SourceRef[];
}) {
  const resolvable =
    officialLink && officialLink !== "MOCK" && /^https?:\/\//.test(officialLink);

  const firstSource = sourceChunkIds
    .map((chunkId) => sources.find((source) => source.chunk_id === chunkId))
    .find(Boolean);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md bg-accent-100 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors duration-150 ease-out hover:bg-accent-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <AlertTriangle aria-hidden="true" className="h-3 w-3" />
          Verify at official portal
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-left">
        {firstSource ? (
          <>
            <p className="text-xs leading-relaxed text-slate-700">{firstSource.snippet}</p>
            <p className="mt-2 text-[11px] text-slate-500">{firstSource.chunk_id}</p>
          </>
        ) : (
          <p className="text-xs text-slate-500">No source excerpt available for this step.</p>
        )}

        {resolvable ? (
          <a
            href={officialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
          >
            Open official document
            <ExternalLink aria-hidden="true" className="h-3 w-3" />
          </a>
        ) : (
          <p className="mt-2 text-[11px] italic text-slate-500">
            Official source not yet linked (demo mode)
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface StepItemProps {
  step: ChecklistStep;
  completed: boolean;
  onToggle: (stepNumber: number, completed: boolean) => void;
  sources: SourceRef[];
}

export function StepItem({ step, completed, onToggle, sources }: StepItemProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const unverified = !step.verified;

  return (
    <div
      className={cn(
        "rounded-card border border-slate-200 bg-white p-4 transition-colors duration-150 ease-out hover:border-brand-100",
        // The hover border colour would otherwise repaint the amber stripe, so it is pinned here.
        unverified && "border-l-4 border-l-accent-500 hover:border-l-accent-500",
        completed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={(event) => onToggle(step.step_number, event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-brand-700"
          aria-label={`Mark step ${step.step_number} complete`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Step {step.step_number}
            </span>
            <h4 className={cn("text-base font-medium text-slate-900", completed && "line-through")}>
              {step.title}
            </h4>
            {unverified && (
              <AlertTriangle
                role="img"
                className="h-3.5 w-3.5 shrink-0 text-accent-500"
                aria-label="Unverified step"
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={detailsId}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 ease-out hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {expanded ? (
              <ChevronUp aria-hidden="true" className="h-3 w-3" />
            ) : (
              <ChevronDown aria-hidden="true" className="h-3 w-3" />
            )}
            {expanded ? "Less" : "Details"}
          </button>

          {expanded && (
            <div id={detailsId} className="mt-3 animate-enter space-y-3">
              <p className="text-[15px] leading-[1.6] text-slate-700">{step.description}</p>

              {step.documents_needed.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {step.documents_needed.map((documentName) => (
                    <Badge
                      key={documentName}
                      variant="secondary"
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-normal text-slate-700 hover:bg-slate-100"
                    >
                      {documentName}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {!step.fee || step.fee === "MOCK" || !step.processing_time || !step.official_link ? (
                  <FieldWarning
                    officialLink={step.official_link}
                    sourceChunkIds={step.source_chunk_ids}
                    sources={sources}
                  />
                ) : (
                  <>
                    {step.fee === "₹0" ? (
                      <Badge className="rounded-full bg-success-100 px-2.5 py-1 text-[13px] font-medium text-emerald-700 hover:bg-success-100">
                        Free
                      </Badge>
                    ) : (
                      <Badge className="rounded-full bg-slate-100 px-2.5 py-1 text-[13px] font-medium text-slate-700 hover:bg-slate-100">
                        Fee: {step.fee}
                      </Badge>
                    )}
                    <Badge className="rounded-full bg-slate-100 px-2.5 py-1 text-[13px] font-medium text-slate-700 hover:bg-slate-100">
                      {step.processing_time}
                    </Badge>
                  </>
                )}
                {step.source_chunk_ids.map((chunkId) => (
                  <SourcePopover key={chunkId} chunkId={chunkId} sources={sources} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
