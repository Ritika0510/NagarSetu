import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and Conditions | NagarSetu",
  description: "The terms for using NagarSetu.",
};

interface Section {
  heading: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    heading: "A navigational aid, not official advice",
    body: [
      "NagarSetu is not a government service and is not affiliated with any department. Checklists are guidance to help you find your way.",
      "Always verify requirements, fees and documents with the official department before you act on a checklist.",
    ],
  },
  {
    heading: "Accuracy",
    body: [
      "We ground answers in official documents and mark fields we could not verify. Rules and fees change, and a checklist can still be out of date or incomplete.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "Use NagarSetu only for lawful purposes. Do not try to disrupt the service, probe it for weaknesses, or submit other people's personal information.",
    ],
  },
  {
    heading: "No warranty",
    body: [
      "NagarSetu is provided as is, without any promise that it is accurate, complete or always available. To the extent the law allows, we are not responsible for losses that result from relying on a checklist.",
    ],
  },
  {
    heading: "Changes",
    body: ["We may update these terms. The date below shows the latest version."],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen font-sans">
      <main className="mx-auto max-w-[720px] px-4 py-16">
        <Link
          href="/landing"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 transition-colors duration-150 ease-out hover:text-brand-700"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to home
        </Link>
        <h1 className="mt-8 text-4xl font-bold tracking-[-0.02em] text-slate-900">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: 16 October 2026</p>
        {SECTIONS.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="text-xl font-bold text-slate-900">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-base leading-[1.7] text-slate-600">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">Contact</h2>
          <p className="mt-3 text-base leading-[1.7] text-slate-600">
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-700 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
