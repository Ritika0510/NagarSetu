import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = {
  title: "FAQ | NagarSetu",
  description: "Answers to common questions about how NagarSetu works.",
};

interface FaqItem {
  question: string;
  answer: ReactNode;
}

const linkClass = "font-medium text-brand-700 hover:underline";

const FAQS: FaqItem[] = [
  {
    question: "Is NagarSetu a government service?",
    answer:
      "No. NagarSetu is a navigational aid built for Code Yudh 2026 and is not affiliated with any department. Always verify requirements, fees and documents with the official department before you act.",
  },
  {
    question: "Where do the answers come from?",
    answer:
      "Checklists are built from official documents. Each step shows the source it came from, so you can read the original yourself.",
  },
  {
    question: "What does an unverified step mean?",
    answer:
      "It means NagarSetu could not confirm a detail, such as a fee or an official link, against a source. The step carries an amber warning so you know to check it at the official portal.",
  },
  {
    question: "What happens if I ask something outside its scope?",
    answer:
      "NagarSetu declines and suggests procedures it can help with, instead of guessing.",
  },
  {
    question: "What if my internet connection drops?",
    answer:
      "Where a saved answer is available, NagarSetu can show it and labels it as a cached response.",
  },
  {
    question: "Can I keep track of my progress?",
    answer:
      "Yes. Tick off each step as you complete it and the progress bar updates. You can also export the checklist as a PDF.",
  },
  {
    question: "Do I need to enter personal details?",
    answer: (
      <>
        No. Please do not type Aadhaar, PAN, phone or bank details. NagarSetu does not need them.
        See the{" "}
        <Link href="/privacy" className={linkClass}>
          Privacy Policy
        </Link>{" "}
        for more.
      </>
    ),
  },
  {
    question: "I found a wrong or outdated step. What should I do?",
    answer: (
      <>
        Tell us through the{" "}
        <Link href="/contact" className={linkClass}>
          contact form
        </Link>{" "}
        and choose &ldquo;Report a wrong or outdated step&rdquo;. Include the procedure name and
        the step number.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="Questions, answered plainly."
        intro="How NagarSetu works, what it will and will not do, and where to check the facts."
      />
      <section className="px-4 py-24">
        <div className="mx-auto max-w-[760px] space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.question}
              className="group rounded-card border border-slate-200 bg-white shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card p-5 text-base font-medium text-slate-900 transition-colors duration-150 ease-out hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-150 ease-out group-open:rotate-180"
                />
              </summary>
              <div className="px-5 pb-5 text-base leading-[1.7] text-slate-600">{item.answer}</div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
