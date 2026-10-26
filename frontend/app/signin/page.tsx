import type { Metadata } from "next";
import SignInPreview from "@/components/ui/travel-connect-signin-1";

export const metadata: Metadata = {
  title: "Sign in | NagarSetu",
  description: "Sign in to your NagarSetu account.",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SignInPreview />
    </div>
  );
}
