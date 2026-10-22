"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Milestone {
  id: number;
  name: string;
  status: "complete" | "in-progress" | "pending";
  position: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
}

interface AnimatedRoadmapProps extends React.HTMLAttributes<HTMLDivElement> {
  milestones: Milestone[];
  mapImageSrc: string;
}

const statusClasses: Record<Milestone["status"], string> = {
  complete: "bg-success-600 border-success-600",
  "in-progress": "bg-brand-500 border-brand-700 animate-pulse",
  pending: "bg-slate-200 border-slate-400",
};

function MilestoneMarker({ milestone }: { milestone: Milestone }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: milestone.id * 0.2, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.8 }}
      className="absolute flex items-center gap-3"
      style={milestone.position}
    >
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <span className="absolute h-full w-full rounded-full bg-brand-100/80" />
        <span
          className={cn(
            "relative z-10 h-3 w-3 rounded-full border-2",
            statusClasses[milestone.status]
          )}
        />
      </div>
      <span className="max-w-[min(14rem,calc(100vw-7rem))] rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm">
        {milestone.name}
      </span>
    </motion.div>
  );
}

const AnimatedRoadmap = React.forwardRef<HTMLDivElement, AnimatedRoadmapProps>(
  ({ className, milestones, mapImageSrc, ...props }, ref) => {
    const targetRef = React.useRef<HTMLDivElement | null>(null);
    const setRefs = React.useCallback(
      (element: HTMLDivElement | null) => {
        targetRef.current = element;
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );
    const { scrollYProgress } = useScroll({
      target: targetRef,
      offset: ["start end", "end start"],
    });
    const pathLength = useTransform(scrollYProgress, [0.15, 0.7], [0, 1]);

    return (
      <div
        ref={setRefs}
        className={cn("relative mx-auto w-full max-w-4xl py-16 md:py-24", className)}
        {...props}
      >
        <div className="pointer-events-none absolute inset-0 top-10 opacity-35">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="relative h-full w-full"
          >
            <Image
              src={mapImageSrc}
              alt=""
              aria-hidden="true"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
            />
          </motion.div>
        </div>

        <div className="relative h-[360px] sm:h-[400px]">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 800 400"
            preserveAspectRatio="none"
            className="absolute left-0 top-0"
            aria-hidden="true"
          >
            <motion.path
              d="M 50 350 Q 200 50 400 200 T 750 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="10 5"
              strokeLinecap="round"
              className="text-brand-700"
              style={{ pathLength }}
            />
          </svg>

          {milestones.map((milestone) => (
            <MilestoneMarker key={milestone.id} milestone={milestone} />
          ))}
        </div>
      </div>
    );
  }
);

AnimatedRoadmap.displayName = "AnimatedRoadmap";

export { AnimatedRoadmap };
