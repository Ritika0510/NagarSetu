import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { TeamGallery } from "@/components/site/TeamGallery";
import { GITHUB_URL, TEAM } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team | NagarSetu",
  description: "The people building NagarSetu.",
};

export default function TeamPage() {
  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="The people behind NagarSetu."
        intro="NagarSetu was built for Code Yudh 2026."
      />
      <section className="px-4 py-24">
        <div className="mx-auto max-w-[1100px]">
          <TeamGallery members={TEAM} />
          <p className="mt-10 text-base leading-[1.6] text-slate-600">
            The code is open on{" "}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-700 hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
