"use client";

import { useEffect, useRef } from "react";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const fillRef = useRef<HTMLDivElement>(null);

  // Width is set through the DOM so the 400ms transition runs without an inline style prop.
  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = `${pct}%`;
  }, [pct]);

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-[13px] text-slate-600">
        <span>
          {completed} of {total} steps complete
        </span>
        <span className="font-bold text-slate-900">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Checklist progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          ref={fillRef}
          className="h-full w-0 rounded-full bg-success-600 transition-[width] duration-[400ms] ease-out"
        />
      </div>
    </div>
  );
}
