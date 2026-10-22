import type { Metadata } from "next";
import { ContactForm } from "@/components/site/ContactForm";
import { PageHeader } from "@/components/site/PageHeader";
import {
  CONTACT_EMAIL,
  CONTACT_NAME,
  CONTACT_PHONE,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact | NagarSetu",
  description: "Ask a question, report a wrong step, or talk to us about a pilot.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to us."
        intro="Ask a question, report a wrong or outdated step, or tell us about a pilot with your city or department."
      />
      <section className="px-4 py-24">
        <div className="mx-auto grid max-w-[1100px] gap-12 md:grid-cols-[3fr_2fr]">
          <ContactForm />
          <aside className="space-y-6">
            <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-900">
                Reporting a wrong step
              </h2>
              <p className="mt-3 text-base leading-[1.6] text-slate-600">
                Choose &ldquo;Report a wrong or outdated step&rdquo; and include the procedure
                name and the step number.
              </p>
            </div>
            <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-900">
                Contact person
              </h2>
              <p className="mt-3 text-base font-medium text-slate-900">
                {CONTACT_NAME}
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 block break-all text-base font-medium text-brand-700 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              <a
                href={`tel:+91${CONTACT_PHONE}`}
                className="mt-2 block text-base font-medium text-brand-700 hover:underline"
              >
                +91 {CONTACT_PHONE}
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
