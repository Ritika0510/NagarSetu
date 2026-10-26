import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | NagarSetu",
  description: "How NagarSetu handles what you type.",
};

interface Section {
  heading: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    heading: "What NagarSetu is",
    body: [
      "NagarSetu turns Indian government procedures into step-by-step checklists. It is a navigational aid built for Code Yudh 2026 and is not an official government service.",
    ],
  },
  {
    heading: "What we process",
    body: [
      "The questions you type are sent to our server so we can build your checklist.",
      "Please do not type personal identifiers such as Aadhaar, PAN, phone numbers or bank details. NagarSetu does not need them to answer.",
    ],
  },
  {
    heading: "Account information",
    body: [
      "If you create an account, we store your name, email address, workspace address, city, state, and postal code in the NagarSetu backend database so you can sign in.",
      "We also store your account preferences and a limited sign-in history, including sign-in time, IP address, and browser user-agent, to show your recent activity and active sessions. You can revoke other active sessions from Account Settings.",
      "Passwords are stored as salted, one-way hashes and are never saved as plain text. Contact us if you want your account information removed.",
    ],
  },
  {
    heading: "How we use it",
    body: ["We use what you type only to generate the checklist you asked for."],
  },
  {
    heading: "Third-party services",
    body: [
      "Checklists are generated with the help of an AI language model service. Your question may be processed by that provider to produce an answer.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You can stop using NagarSetu at any time. If you want something you typed removed, contact us and we will look into it.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: ["If we change this policy, we will update this page and the date below."],
  },
];

export default function PrivacyPage() {
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
          Privacy Policy
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
