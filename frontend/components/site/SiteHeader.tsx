"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4"
      >
        <Link href="/landing" aria-label="NagarSetu home" className="flex items-center gap-2">
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

        <ul className="hidden items-center gap-6 lg:flex">
          {SITE_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-sm transition-colors duration-150 ease-out hover:text-brand-700",
                    active ? "font-medium text-brand-700" : "text-slate-600"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

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
            aria-controls="site-menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors duration-150 ease-out hover:bg-slate-100 lg:hidden"
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
        <ul
          id="site-menu"
          className="absolute inset-x-0 top-16 animate-enter border-b border-slate-100 bg-white px-4 py-2 shadow-sm lg:hidden"
        >
          {SITE_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === item.href ? "page" : undefined}
                className="block py-3 text-base text-slate-900 transition-colors duration-150 ease-out hover:text-brand-700"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
