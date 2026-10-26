"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock3, IndianRupee, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchProgress, getSessionId, updateProgress } from "@/lib/api";
import type { Checklist, SourceRef } from "@/lib/types";
import { ExportButton } from "./ExportButton";
import { StepItem } from "./StepItem";

interface ChecklistCardProps {
  checklist: Checklist;
  sources: SourceRef[];
  onProgressChange?: (completed: number, total: number) => void;
}

const metaChip =
  "rounded-full bg-slate-100 px-3 py-1 text-[13px] font-normal text-slate-700 hover:bg-slate-100";

export function ChecklistCard({ checklist, sources, onProgressChange }: ChecklistCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const lastReported = useRef<string>("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const total = checklist.steps.length;
  const progressPercent = total > 0 ? Math.round((completedSteps.length / total) * 100) : 0;

  useEffect(() => {
    let cancelled = false;
    // Clear the previous procedure's ticks so a first visit never shows stale progress.
    setCompletedSteps([]);
    fetchProgress(getSessionId(), checklist.procedure_id)
      .then((progress) => {
        if (!cancelled) setCompletedSteps(progress.completed_steps);
      })
      .catch(() => {
        // First visit: no persisted state.
      });
    return () => {
      cancelled = true;
    };
  }, [checklist.procedure_id]);

  // Report progress to the parent from an effect, not from inside a state updater.
  useEffect(() => {
    const key = `${checklist.procedure_id}:${completedSteps.length}/${total}`;
    if (lastReported.current === key) return;
    lastReported.current = key;
    onProgressChange?.(completedSteps.length, total);
  }, [checklist.procedure_id, completedSteps.length, total, onProgressChange]);

  // Width is set through the DOM so the 400ms transition runs without an inline style prop.
  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = `${progressPercent}%`;
  }, [progressPercent]);

  const handleToggle = (stepNumber: number, completed: boolean) => {
    setCompletedSteps((previous) =>
      completed
        ? previous.includes(stepNumber)
          ? previous
          : [...previous, stepNumber]
        : previous.filter((value) => value !== stepNumber)
    );

    updateProgress({
      session_id: getSessionId(),
      procedure_id: checklist.procedure_id,
      step_number: stepNumber,
      completed,
    }).catch((error) => console.error("Progress save failed:", error));
  };

  const hasUnverifiedFields = checklist.steps.some(
    (step) => step.verified === false || !step.fee
  );
  const isMock = sources.some((source) => source.source_url === "MOCK");
  const VERIFIED_DATES: Record<string, string> = {
    chandigarh_trade_license: "8 Oct 2026 (Demo dataset)",
    water_connection: "8 Oct 2026 (Demo dataset)",
    property_tax: "8 Oct 2026 (Demo dataset)",
  };
  const lastVerified =
    VERIFIED_DATES[checklist.procedure_id] ||
    (isMock ? "Unverified (Demo fixture)" : "Awaiting departmental audit");

  return (
    <div ref={cardRef} className="space-y-4">
      <Card className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-[20px] font-bold text-slate-900">
                {checklist.procedure_name}
              </CardTitle>
              <p className="mt-2 text-sm leading-normal text-slate-600">{checklist.summary}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isMock && (
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Demo data
                </span>
              )}
              <ExportButton procedureId={checklist.procedure_id} targetRef={cardRef} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {checklist.estimated_total_time && (
              <Badge className={metaChip}>
                <Clock3 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                {checklist.estimated_total_time}
              </Badge>
            )}
            {checklist.estimated_total_cost && (
              <Badge className={metaChip}>
                <IndianRupee aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                {checklist.estimated_total_cost}
              </Badge>
            )}
            <Badge className={metaChip}>
              <ShieldCheck aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
              {Math.round(checklist.confidence * 100)}% confidence
            </Badge>
          </div>

          {hasUnverifiedFields && (
            <div
              className="flex items-start gap-2 rounded-lg border border-accent-500/40 bg-accent-50 px-3 py-2 text-xs text-amber-700"
              role="alert"
            >
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Some details need verification at the official portal</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pb-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px] text-slate-600">
              <span>
                {completedSteps.length} of {total} steps complete
              </span>
              <span className="font-bold text-slate-900">{progressPercent}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Checklist progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
            >
              <div
                ref={fillRef}
                className="h-full w-0 rounded-full bg-success-600 transition-[width] duration-[400ms] ease-out"
              />
            </div>
          </div>

          {checklist.warnings.map((warning, index) => (
            <div
              key={`${warning}-${index}`}
              className="flex items-start gap-2 rounded-lg border border-accent-500/40 bg-accent-50 px-3 py-2 text-xs text-slate-700"
            >
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
              />
              <span>{warning}</span>
            </div>
          ))}

          <div className="space-y-3">
            {checklist.steps.map((step) => (
              <StepItem
                key={step.step_number}
                step={step}
                completed={completedSteps.includes(step.step_number)}
                onToggle={handleToggle}
                sources={sources}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            <span>Navigational aid. Verify with the official department.</span>
            <span className="shrink-0">Last verified: {lastVerified}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
