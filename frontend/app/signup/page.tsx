import Image from "next/image";
import Link from "next/link";
import { WorkspaceSignUpForm } from "@/components/ui/workspace-sign-up";

export const metadata = {
  title: "Create your account | NagarSetu",
  description: "Create a NagarSetu account to get personalized civic guidance.",
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white/30 via-sky-50/10 to-brand-50/20 px-4 py-24">
      <Link
        href="/landing"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/70 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 sm:left-8 sm:top-6"
      >
        <Image
          src="/nagarsetu-logo-horizontal.svg"
          alt="NagarSetu"
          width={140}
          height={32}
          priority
          style={{ width: "126px", height: "auto" }}
        />
        <span className="sr-only">Back to NagarSetu home</span>
      </Link>
      <WorkspaceSignUpForm />
    </main>
  );
}
