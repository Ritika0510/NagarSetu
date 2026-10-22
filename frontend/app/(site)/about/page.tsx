import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  MapPinned,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About | NagarSetu",
  description:
    "Learn how NagarSetu turns civic procedure questions into clear, source-linked checklists.",
};

const PRINCIPLES = [
  {
    icon: FileCheck2,
    title: "Clear steps",
    description:
      "Turn a question about a civic service into an ordered checklist with documents, fees, and estimated timelines.",
  },
  {
    icon: BadgeCheck,
    title: "Sources you can check",
    description:
      "We show the sources behind guidance so residents can verify details with the relevant department.",
  },
  {
    icon: ShieldAlert,
    title: "Honest about uncertainty",
    description:
      "When a detail is unverified or a question is outside our scope, we make that clear instead of presenting a guess as fact.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About NagarSetu"
        title="A clearer path through civic services."
        intro="NagarSetu helps people make sense of government procedures by turning plain-language questions into practical, source-linked checklists."
      />

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1100px] gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Built to make the next step easier
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Finding the right government service can mean piecing together
              information from many documents and portals. NagarSetu is a
              navigational aid that brings those instructions together into a
              step-by-step plan, so residents can see what to do next.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The project includes examples such as trade-license applications,
              water connections, and property-tax payments. Checklists can track
              completed steps and be exported for reference.
            </p>
            <Button
              asChild
              className="mt-7 h-11 rounded-lg bg-brand-700 px-6 text-white hover:bg-brand-900"
            >
              <Link href="/">
                Explore NagarSetu
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-7 sm:p-9">
            <MapPinned aria-hidden="true" className="h-8 w-8 text-brand-700" />
            <h2 className="mt-5 text-xl font-bold text-slate-900">
              A guide, not a government office
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              NagarSetu is not affiliated with a government department and
              cannot submit applications on your behalf. Requirements, fees,
              and timelines can change; confirm them with the official
              department before acting.
            </p>
            <Link
              href="/privacy"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
            >
              Read our privacy policy
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
            Principles behind the product
          </h2>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 text-center">
        <p className="text-sm text-slate-600">
          Questions or feedback?{" "}
          <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
            Contact the NagarSetu team
          </Link>
          .
        </p>
      </section>
    </>
  );
}
