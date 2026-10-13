"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChecklistStep, SourceRef } from "@/lib/types";
import { SourcePopover } from "./SourcePopover";

/** Task 3: field-level unverified warning, popover variant. */
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
    .map((cid) => sources.find((s) => s.chunk_id === cid))
    .find(Boolean);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-warning/25"
        >
          <AlertTriangle className="h-3 w-3" />
          Verify at official portal
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-left">
        {firstSource ? (
          <>
            <p className="text-xs leading-relaxed text-foreground">{firstSource.snippet}</p>
            <p className="mt-2 text-[10px] text-muted-foreground">{firstSource.chunk_id}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            No source excerpt available for this step.
          </p>
        )}
        {resolvable ? (
          <a
            href={officialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Open official document
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="mt-2 text-[10px] italic text-muted-foreground">
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
  const unverified = !step.verified;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        completed && "opacity-70",
        unverified && "border-l-4 border-l-warning"
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => onToggle(step.step_number, e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#1E40AF]"
          aria-label={`Mark step ${step.step_number} complete`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Step {step.step_number}
            </span>
            <h4 className={cn("text-sm font-medium text-foreground", completed && "line-through")}>
              {step.title}
            </h4>
            {unverified && (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" aria-label="Unverified step" />
            )}
          </div>

          {/* Collapsible description */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Less" : "Details"}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              <p className="text-sm leading-relaxed text-foreground">{step.description}</p>

              {step.documents_needed.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.documents_needed.map((doc) => (
                    <Badge key={doc} variant="secondary">{doc}</Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Task 3: ONE warning per step. Any missing field
                    (fee/processing_time/official_link) → single amber
                    pill; all present → normal badges. Never two pills. */}
                {!step.fee || step.fee === "MOCK" || !step.processing_time || !step.official_link ? (
                  <FieldWarning
                    officialLink={step.official_link}
                    sourceChunkIds={step.source_chunk_ids}
                    sources={sources}
                  />
                ) : (
                  <>
                    {step.fee === "₹0" ? (
                      <Badge variant="success">Free</Badge>
                    ) : (
                      <Badge>Fee: {step.fee}</Badge>
                    )}
                    <Badge variant="secondary">{step.processing_time}</Badge>
                  </>
                )}
                {step.source_chunk_ids.map((cid) => (
                  <SourcePopover key={cid} chunkId={cid} sources={sources} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}