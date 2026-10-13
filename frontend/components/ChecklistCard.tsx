"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchProgress, getSessionId, updateProgress } from "@/lib/api";
import type { Checklist, SourceRef } from "@/lib/types";
import { ExportButton } from "./ExportButton";
import { ProgressBar } from "./ProgressBar";
import { StepItem } from "./StepItem";

interface ChecklistCardProps {
  checklist: Checklist;
  sources: SourceRef[];
  onProgressChange?: (completed: number, total: number) => void;
}

export function ChecklistCard({ checklist, sources, onProgressChange }: ChecklistCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const sessionId = typeof window !== "undefined" ? getSessionId() : "";

  // Load persisted progress on mount (F-05: close and resume)
  useEffect(() => {
    let cancelled = false;
    fetchProgress(getSessionId(), checklist.procedure_id)
      .then((p) => {
        if (!cancelled) {
          setCompletedSteps(p.completed_steps);
          onProgressChange?.(p.completed_steps.length, checklist.steps.length);
        }
      })
      .catch(() => { /* first visit */ });
    return () => { cancelled = true; };
  }, [checklist.procedure_id, checklist.steps.length, onProgressChange]);

  const handleToggle = (stepNumber: number, completed: boolean) => {
    setCompletedSteps((prev) => {
      const next = completed
        ? [...new Set([...prev, stepNumber])]
        : prev.filter((n) => n !== stepNumber);
      onProgressChange?.(next.length, checklist.steps.length);
      return next;
    });
    updateProgress({
      session_id: sessionId,
      procedure_id: checklist.procedure_id,
      step_number: stepNumber,
      completed,
    }).catch((err) => console.error("Progress save failed:", err));
  };

  const total = checklist.steps.length;

  // Task 3: unverified-fields banner — fires ONLY on real verify-layer
  // signal: an unverified step or a missing fee.
  const hasUnverifiedFields = checklist.steps.some(
    (s) => s.verified === false || !s.fee
  );

  // Task 3: mock-source badge computation
  const isMock = sources.some((s) => s.source_url === "MOCK");

  return (
    <div ref={cardRef} className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          {/* Task 3: persistent mock-data badge */}
          {isMock && (
            <span className="mb-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              Demo data — not yet verified against official source
            </span>
          )}
          {/* Task 3: unverified-fields banner */}
          {hasUnverifiedFields && (
            <div
              className="mb-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
              style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Some details need verification at the official portal</span>
            </div>
          )}
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{checklist.procedure_name}</CardTitle>
              <p className="mt-1.5 text-sm text-muted-foreground">{checklist.summary}</p>
            </div>
            <ExportButton procedureId={checklist.procedure_id} targetRef={cardRef} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {checklist.estimated_total_time && (
              <Badge variant="secondary">⏱ {checklist.estimated_total_time}</Badge>
            )}
            {checklist.estimated_total_cost && (
              <Badge variant="secondary">{checklist.estimated_total_cost}</Badge>
            )}
            <Badge variant={checklist.confidence >= 0.6 ? "success" : "warning"}>
              {Math.round(checklist.confidence * 100)}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar completed={completedSteps.length} total={total} />

          {checklist.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-slate-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              <span>{w}</span>
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

          <p className="text-center text-[11px] text-muted-foreground">
            Navigational aid. Verify with the official department.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}