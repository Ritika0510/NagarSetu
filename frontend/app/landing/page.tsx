"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  IndianRupee,
  Menu,
  MessageSquare,
  PanelLeft,
  Route,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import KilnWordmarkFooter from "@/components/ui/kiln-wordmark-footer";
import { SettingsSidebarAccordion } from "@/components/ui/settings-sidebar-accordion";
import { cn } from "@/lib/utils";

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com";
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL ?? GITHUB_URL;

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface NavLink {
  label: string;
  href: string;
}

interface Stage {
  number: string;
  label: string;
  body: string;
  icon: IconType;
}

interface Feature {
  text: string;
  icon: IconType;
}

interface Stat {
  value: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Sign in", href: "/signin" },
  { label: "Sign up", href: "/signup" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Use cases", href: "/use-cases" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const PROBLEM_STATS: string[] = [
  "4 departments.",
  "11 documents.",
  "3 portals.",
  "0 clarity.",
];

const STAGES: Stage[] = [
  { number: "01", label: "Ask", body: "Type what you need in plain language.", icon: MessageSquare },
  {
    number: "02",
    label: "Navigate",
    body: "Get the full path with documents, fees, and official links.",
    icon: Route,
  },
  { number: "03", label: "Complete", body: "Track your progress and export as PDF.", icon: CheckCircle2 },
];

const FEATURES: Feature[] = [
  { text: "Documents you need for each step", icon: FileText },
  { text: "Fees and time estimates", icon: IndianRupee },
  { text: "Links to official portals", icon: ExternalLink },
  { text: "Source citations you can check", icon: ShieldCheck },
  { text: "Warnings when a field is unverified", icon: AlertTriangle },
];

const NUMBERS: Stat[] = [
  { value: "18/18", label: "Eval pass rate" },
  { value: "100%", label: "Citation rate" },
  { value: "5/5", label: "Trap refusals" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

const h2Class =
  "text-[32px] font-bold leading-tight tracking-[-0.02em] text-slate-900 sm:text-4xl";

const primaryCta =
  "h-auto rounded-lg bg-brand-700 px-7 py-3.5 text-base font-bold text-white transition-all duration-150 ease-out hover:-translate-y-px hover:bg-brand-900 hover:shadow-md";

function Navbar() {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY >= 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 h-16 border-b border-slate-100 bg-white transition-shadow duration-150 ease-out",
          scrolled && "bg-white/80 shadow-sm backdrop-blur-md"
        )}
      >
        <nav
          aria-label="Primary"
          className="flex h-full w-full items-center justify-between px-4"
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
            aria-controls="landing-sidebar"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-brand-700",
              focusRing
            )}
          >
            {sidebarOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <PanelLeft aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
          <Link
            href="/landing"
            aria-label="NagarSetu home"
            className={cn("flex items-center gap-2 rounded", focusRing)}
          >
            <Image
              src="/nagarsetu-logo-horizontal.svg"
              alt="NagarSetu"
              width={140}
              height={32}
              priority
              className="h-8 w-auto"
              style={{ width: "auto" }}
            />
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={cn(
                  "rounded text-sm text-slate-600 transition-colors duration-150 ease-out hover:text-brand-700",
                  focusRing
                )}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              className="h-auto rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 ease-out hover:bg-brand-900"
            >
              <Link href="/">
                Open App
                <ArrowRight aria-hidden="true" className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors duration-150 ease-out hover:bg-slate-100 lg:hidden",
                focusRing
              )}
            >
              {open ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>
        {open && (
          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-16 max-h-[calc(100dvh-4rem)] animate-enter overflow-y-auto border-b border-slate-100 bg-white shadow-sm lg:hidden"
          >
            <ul className="w-full px-4 py-2">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-base text-slate-900 transition-colors duration-150 ease-out hover:text-brand-700"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
      <LandingSidebarDrawer open={sidebarOpen} onClose={closeSidebar} />
    </>
  );
}

function LandingSidebarDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-slate-950/40"
          />
          <aside
            id="landing-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="NagarSetu options"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-2rem))] flex-col overflow-y-auto border-r border-slate-200 bg-slate-50 p-4 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
                  NagarSetu
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Quick options
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close sidebar"
                onClick={onClose}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900",
                  focusRing
                )}
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <SettingsSidebarAccordion />
          </aside>
        </div>
      )}
    </>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] w-full items-center overflow-hidden bg-white/35 px-4 py-8 sm:py-10 lg:py-12">
      <div className="relative mx-auto flex w-full flex-col items-center text-center">
        <span className="rounded-md bg-accent-100 px-3 py-1.5 text-xs font-medium tracking-[0.05em] text-amber-700">
          Built for Code Yudh 2026
        </span>
        <h1 className="mt-5 max-w-[min(100%,90rem)] text-balance text-[clamp(3rem,8vw,7rem)] font-bold leading-[1.02] tracking-[-0.035em] text-slate-900 sm:mt-6">
          Government procedures,
          <br />
          navigated.
        </h1>
        <p className="mt-5 max-w-[min(100%,56rem)] text-[clamp(1.125rem,2vw,1.65rem)] leading-[1.55] text-slate-600">
          Type what you need. Get a personalized, step-by-step checklist grounded in
          official documents.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild className={primaryCta}>
            <Link href="/">
              Open Demo
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto rounded-lg border border-brand-700 bg-white/85 px-7 py-3.5 text-base font-bold text-brand-700 transition-colors duration-150 ease-out hover:bg-brand-50"
          >
            <Link href="/signup">Create an account</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto rounded-lg border border-slate-900 bg-white px-7 py-3.5 text-base font-bold text-slate-900 transition-colors duration-150 ease-out hover:bg-slate-100"
          >
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </Button>
        </div>
        <p className="mt-5 text-sm text-slate-500">
          NagarSetu · 18/18 on our eval · 100% citation rate
        </p>
        <div
          aria-label="NagarSetu product demos. Scroll horizontally to view the next image."
          className="demo-gallery-scrollbar mt-6 w-full snap-x snap-mandatory scroll-ps-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-900/10 sm:mt-8 sm:p-4"
          role="region"
          tabIndex={0}
        >
          <div className="flex w-full">
            <figure className="w-full shrink-0 basis-full snap-start overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <Image
                src="/nagarsetu-trade-license-demo.png"
                alt="NagarSetu trade license checklist with official source warnings and progress"
                width={1455}
                height={560}
                priority
                className="h-auto w-full"
              />
              <figcaption className="border-t border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700">
                Track a trade license application
              </figcaption>
            </figure>
            <figure className="w-full shrink-0 basis-full snap-start overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <Image
                src="/nagarsetu-water-connection-demo.png"
                alt="NagarSetu demo showing a water connection question and checklist steps"
                width={1477}
                height={563}
                priority
                className="h-auto w-full"
              />
              <figcaption className="border-t border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700">
                Find the steps for a water connection
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemStrip() {
  return (
    <section className="bg-accent-50/50 px-4 py-14 sm:py-20 lg:py-24">
      <div className="mx-auto flex w-full flex-col items-center text-center">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          {PROBLEM_STATS.map((stat, index) => (
            <div key={stat} className="flex flex-col items-center gap-6 md:flex-row">
              <span className="text-2xl font-bold leading-none text-slate-900 sm:text-[32px]">{stat}</span>
              {index < PROBLEM_STATS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden h-5 w-5 rounded-full bg-accent-500 md:block"
                />
              )}
            </div>
          ))}
        </div>
        <p className="mt-8 text-[22px] text-slate-600">Today, the citizen has no map.</p>
      </div>
    </section>
  );
}

function Journey() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-white/75 px-4 py-14 sm:py-20 lg:py-24">
      <div className="mx-auto w-full">
        <h2 className={cn(h2Class, "mb-14 text-center")}>From question to checklist.</h2>
        <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden="true"
            className="absolute left-[16.66%] right-[16.66%] top-6 hidden h-px bg-slate-200 md:block"
          />
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            return (
              <div key={stage.number} className="relative flex flex-col items-center">
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-accent-500 bg-accent-50 text-amber-700">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div className="mt-6 flex w-full flex-1 flex-col rounded-card border border-slate-200 bg-white/90 p-8 shadow-card transition-all duration-150 ease-out hover:border-brand-100 hover:shadow-cardHover">
                  <p className="mb-4 text-5xl font-bold text-accent-500">{stage.number}</p>
                  <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-900">
                    {stage.label}
                  </h3>
                  <p className="text-base leading-[1.6] text-slate-600">{stage.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductSection() {
  return (
    <section id="product" className="scroll-mt-16 px-4 py-24">
      <div className="mx-auto grid w-full items-center gap-8 md:grid-cols-2 lg:gap-12">
        <div>
          <h2 className={h2Class}>Try it. Right now.</h2>
          <p className="mt-4 max-w-[400px] text-base leading-[1.7] text-slate-600">
            Our live demo runs the same pipeline we&apos;ll deploy to the municipal
            corporation.
          </p>
          <Button
            asChild
            className="mt-8 h-auto rounded-lg bg-brand-700 px-7 py-3.5 text-base font-bold text-white transition-all duration-150 ease-out hover:-translate-y-px hover:bg-brand-900 hover:shadow-md"
          >
            <Link href="/">
              Open Live Demo
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="self-center rounded-card border border-slate-200 bg-white/90 p-8 shadow-card">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-900">
            Every checklist includes
          </h3>
          <ul className="mt-5 space-y-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.text} className="flex items-center gap-3 text-base text-slate-700">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  {feature.text}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function NumbersStrip() {
  return (
    <section className="bg-brand-900 px-4 py-14 text-white sm:py-20 lg:py-24">
      <div className="mx-auto grid w-full gap-8 text-center md:grid-cols-3 lg:gap-12">
        {NUMBERS.map((stat) => (
          <div key={stat.label}>
            <p className="text-5xl font-bold leading-none sm:text-[64px]">{stat.value}</p>
            <p className="mt-2 text-sm tracking-[0.05em] text-brand-100">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="bg-white/75 px-4 py-14 sm:py-20 lg:py-24">
      <div className="mx-auto w-full">
        <h2 className={cn(h2Class, "mb-12 text-center")}>We mark what we don&apos;t know.</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Image
            src="/nagarsetu-out-of-scope-example.png"
            alt="NagarSetu offline query screen showing that a response is unavailable"
            width={1858}
            height={626}
            className="h-auto w-full rounded-card border border-slate-200 bg-white shadow-card"
          />
          <Image
            src="/nagarsetu-unverified-step-example.png"
            alt="NagarSetu trade license checklist with a notice that details are not yet verified"
            width={1857}
            height={600}
            className="h-auto w-full rounded-card border border-slate-200 bg-white shadow-card"
          />
        </div>
        <p className="mt-8 text-center text-base text-slate-600">
          Out-of-scope queries refuse. Uncertain fields warn. We never hide data provenance.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <KilnWordmarkFooter
      brand="NagarSetu"
      wordmark="NagarSetu"
      motto={["A clearer path", "to civic services"]}
      address={["Step-by-step civic guidance", "Grounded in official documents"]}
      navigationTitle="Explore"
      navigation={[
        [
          { label: "Home", href: "/" },
          { label: "Create account", href: "/signup" },
          { label: "How it works", href: "/landing#how-it-works" },
          { label: "Use cases", href: "/use-cases" },
          { label: "Sign in", href: "/signin" },
        ],
        [
          { label: "About", href: "/about" },
          { label: "FAQ", href: "/faq" },
          { label: "Contact", href: "/contact" },
        ],
      ]}
      followTitle="Project"
      socials={[[{ label: "GitHub", href: GITHUB_URL }, { label: "Docs", href: DOCS_URL }]]}
      year={2026}
      registry="Navigational aid. Verify with the official department."
      legal={[
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ]}
      surface="#2563eb"
      deep="#1e3a8a"
      ink="#ffffff"
      paper="#1e3a8a"
    />
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh w-full font-sans">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="w-full">
        <Hero />
        <ProblemStrip />
        <Journey />
        <ProductSection />
        <NumbersStrip />
        <TrustSection />
      </main>
      <Footer />
    </div>
  );
}
