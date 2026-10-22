import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Droplets,
  ExternalLink,
  FileText,
  IndianRupee,
  Receipt,
  ShieldCheck,
  Store,
} from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { PRIMARY_BUTTON } from "@/lib/site";

export const metadata: Metadata = {
  title: "Use cases | NagarSetu",
  description: "Procedures you can start with in NagarSetu and what every checklist includes.",
};

const CASES = [
  {
    icon: Store,
    title: "Open a small shop",
    about: "Starting a small business in your city.",
    example: "I want to open a small shop in Chandigarh",
  },
  {
    icon: Droplets,
    title: "Get a water connection",
    about: "A new water connection for your home.",
    example: "I need a new water connection for my house",
  },
  {
    icon: Receipt,
    title: "Pay property tax",
    about: "Paying your property tax.",
    example: "How do I pay my property tax in Chandigarh?",
  },
];

const INCLUDED = [
  { icon: FileText, text: "Documents you need for each step" },
  { icon: IndianRupee, text: "Fees and time estimates" },
  { icon: ExternalLink, text: "Links to official portals" },
  { icon: ShieldCheck, text: "Source citations you can check" },
  { icon: AlertTriangle, text: "Warnings when a field is unverified" },
];

export default function UseCasesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Use cases"
        title="Start with the procedure you need."
        intro="These are the examples built into the app. You can also type your own question."
      />

      <section className="px-4 py-24">
        <div className="mx-auto grid max-w-[1100px] gap-6 md:grid-cols-3">
          {CASES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col rounded-card border border-slate-200 bg-white p-8 shadow-card transition-all duration-150 ease-out hover:border-brand-100 hover:shadow-cardHover"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-lg font-bold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-base leading-[1.6] text-slate-600">{item.about}</p>
                <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Example question
                </p>
                <p className="mt-2 text-[15px] leading-[1.6] text-slate-900">
                  &ldquo;{item.example}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
        <p className="mx-auto mt-8 max-w-[1100px] text-base leading-[1.6] text-slate-600">
          Not on the list? Type it in your own words. If it is outside what NagarSetu can answer,
          it says so instead of guessing.
        </p>
      </section>

      <section className="bg-accent-50/50 px-4 py-24">
        <div className="mx-auto grid max-w-[1100px] items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-[32px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
              Every checklist includes
            </h2>
            <p className="mt-4 max-w-[400px] text-base leading-[1.7] text-slate-600">
              Tick off steps as you go to track progress, and export the checklist as a PDF.
            </p>
            <Button asChild className={`${PRIMARY_BUTTON} mt-8`}>
              <Link href="/">
                Open the app
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ul className="space-y-4 rounded-card border border-slate-200 bg-white p-8 shadow-card">
            {INCLUDED.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex items-center gap-3 text-base text-slate-700">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  {item.text}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
