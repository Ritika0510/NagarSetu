"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { TeamMember } from "@/lib/site";

export function TeamGallery({ members }: { members: TeamMember[] }) {
  const [activeMember, setActiveMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!activeMember) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setActiveMember(null);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeMember]);

  return (
    <>
      <ol className="grid gap-4 md:grid-cols-2">
        {members.map((member) => (
          <li
            key={member.name}
            className="group flex items-start gap-5 rounded-card border border-slate-200 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-100 hover:shadow-cardHover sm:p-6"
          >
            <button
              type="button"
              onClick={() => setActiveMember(member)}
              aria-label={`View ${member.name}'s profile photo and details`}
              className="shrink-0 overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
            >
              <Image
                src={member.image}
                alt={`Portrait of ${member.name}`}
                width={160}
                height={192}
                className="h-32 w-24 object-cover object-top transition-transform duration-200 group-hover:scale-[1.03]"
              />
            </button>
            <div className="min-w-0 flex-1">
              <p className="mt-1 text-lg font-bold text-slate-900">{member.name}</p>
              <p className="mt-1 text-sm font-medium text-brand-700">{member.role}</p>
              <dl className="mt-3 space-y-1.5 text-sm text-slate-600">
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${member.email}`}
                      className="break-all hover:text-brand-700 hover:underline"
                    >
                      {member.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${member.phone}`}
                      className="hover:text-brand-700 hover:underline"
                    >
                      {member.phone}
                    </a>
                  </dd>
                </div>
                {member.university && (
                  <div>
                    <dt className="sr-only">University</dt>
                    <dd>{member.university}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-3 text-xs text-slate-500">Select photo to view profile</p>
            </div>
          </li>
        ))}
      </ol>

      {activeMember && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveMember(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-profile-name"
            className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]"
          >
            <button
              type="button"
              onClick={() => setActiveMember(null)}
              aria-label="Close profile"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="flex max-h-[75vh] items-center justify-center bg-slate-100 md:max-h-[80vh]">
              <Image
                src={activeMember.image}
                alt={`Portrait of ${activeMember.name}`}
                width={768}
                height={1024}
                className="max-h-[75vh] w-full object-contain md:max-h-[80vh]"
                priority
              />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                NagarSetu team
              </p>
              <h2
                id="team-profile-name"
                className="mt-2 text-2xl font-bold text-slate-900"
              >
                {activeMember.name}
              </h2>
              <p className="mt-2 text-base font-medium text-brand-700">
                {activeMember.role}
              </p>
              <dl className="mt-6 space-y-4 text-sm text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-900">Email</dt>
                  <dd className="mt-1 break-all">
                    <a href={`mailto:${activeMember.email}`} className="hover:text-brand-700">
                      {activeMember.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Phone</dt>
                  <dd className="mt-1">
                    <a href={`tel:${activeMember.phone}`} className="hover:text-brand-700">
                      {activeMember.phone}
                    </a>
                  </dd>
                </div>
                {activeMember.university && (
                  <div>
                    <dt className="font-semibold text-slate-900">University</dt>
                    <dd className="mt-1">{activeMember.university}</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
