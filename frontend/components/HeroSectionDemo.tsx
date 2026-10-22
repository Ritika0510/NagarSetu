"use client";

import Link from "next/link";
import { AnimatedRoadmap, type Milestone } from "@/components/ui/hero-section-5";
import { Button } from "@/components/ui/button";

const milestones: Milestone[] = [
  {
    id: 1,
    name: "Describe your need",
    status: "complete",
    position: { top: "70%", left: "5%" },
  },
  {
    id: 2,
    name: "Review requirements",
    status: "complete",
    position: { top: "15%", left: "20%" },
  },
  {
    id: 3,
    name: "Prepare your application",
    status: "in-progress",
    position: { top: "45%", left: "55%" },
  },
  {
    id: 4,
    name: "Submit at the official portal",
    status: "pending",
    position: { top: "10%", right: "5%" },
  },
];

const mapImageSrc =
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80";

export function HeroSectionDemo() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="overflow-hidden bg-white px-6 py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-[1100px] text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
          How it works
        </p>
        <h2
          id="how-it-works-title"
          className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          A clearer route through civic services.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Start with a question and follow a guided path to the right documents,
          department, and official portal.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Example journey only — markers do not represent live application status.
        </p>

        <AnimatedRoadmap
          className="py-12 md:py-16"
          milestones={milestones}
          mapImageSrc={mapImageSrc}
          aria-label="Example journey from describing a civic need to submitting an application"
        />

        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/">Open the demo</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#demo">See a sample checklist</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
