import Image from "next/image";
import Link from "next/link";
import { GITHUB_URL, type NavItem } from "@/lib/site";

const GROUPS: Array<{ title: string; links: NavItem[] }> = [
  {
    title: "Product",
    links: [
      { label: "Use cases", href: "/use-cases" },
      { label: "How it works", href: "/landing#how-it-works" },
      { label: "Open the app", href: "/" },
      { label: "Sign in", href: "/signin" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Team", href: "/team" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms and Conditions", href: "/terms" },
    ],
  },
];

const linkClass = "text-sm text-slate-600 transition-colors duration-150 ease-out hover:text-slate-900";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 px-4 py-16">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/nagarsetu-logo-horizontal.svg"
              alt="NagarSetu"
              width={140}
              height={32}
              style={{ width: "120px", height: "auto" }}
            />
            <p className="mt-4 max-w-[280px] text-sm leading-[1.6] text-slate-600">
              Step-by-step checklists for government procedures, grounded in official documents.
            </p>
           
            <a
              href="https://github.com/Ritika0510/NagarSetu"
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkClass} mt-4 inline-block`}
            >
              GitHub
            </a>

          </div>
          {GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-900">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 space-y-1 border-t border-slate-100 pt-6 text-xs text-slate-400">
          <p>Built for Code Yudh 2026.</p>
          <p>Navigational aid. Verify with the official department.</p>
        </div>
      </div>
    </footer>
  );
}
