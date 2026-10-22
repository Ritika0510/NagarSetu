"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeTwoFactorSignIn, signIn } from "@/lib/auth";

function RouteMap() {
  return (
    <svg
      viewBox="0 0 480 560"
      fill="none"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="route-map-dots"
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="#2563eb" fillOpacity=".22" />
        </pattern>
        <linearGradient id="route-map-glow" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#dbeafe" />
          <stop offset="1" stopColor="#eef2ff" />
        </linearGradient>
      </defs>
      <path fill="url(#route-map-glow)" d="M0 0h480v560H0z" />
      <path fill="url(#route-map-dots)" d="M0 0h480v560H0z" />
      <path
        d="M64 429c68-63 52-169 136-203 53-21 88 28 141-11 31-23 39-71 77-103"
        stroke="#93c5fd"
        strokeWidth="2"
        strokeDasharray="5 10"
      />
      <path
        d="M56 167c53 30 72 95 131 108 62 14 96-36 152-14 32 13 45 45 79 63"
        stroke="#c4b5fd"
        strokeWidth="2"
        strokeDasharray="5 10"
      />
      <motion.path
        d="M64 429c68-63 52-169 136-203 53-21 88 28 141-11 31-23 39-71 77-103"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      {[
        { x: 64, y: 429 },
        { x: 200, y: 226 },
        { x: 341, y: 215 },
        { x: 418, y: 112 },
        { x: 187, y: 275 },
        { x: 339, y: 324 },
      ].map((point, index) => (
        <g key={`${point.x}-${point.y}`}>
          <circle cx={point.x} cy={point.y} r="10" fill="#2563eb" fillOpacity=".12" />
          <circle cx={point.x} cy={point.y} r="4" fill={index < 4 ? "#1e40af" : "#7c3aed"} />
        </g>
      ))}
    </svg>
  );
}

export default function SignInPreview() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [authenticatorCode, setAuthenticatorCode] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const result = await signIn(email.trim(), password);
      if (result.requiresTwoFactor) {
        setChallengeId(result.challengeId);
        setAuthenticatorCode("");
        return;
      }
      await finishSignIn();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't sign you in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishSignIn = (): void => {
    const requestedDestination = new URLSearchParams(window.location.search).get(
      "next"
    );
    const destination =
      requestedDestination?.startsWith("/") &&
      !requestedDestination.startsWith("//")
        ? requestedDestination
        : "/";
    router.push(destination);
  };

  const handleTwoFactorSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !challengeId) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await completeTwoFactorSignIn(challengeId, authenticatorCode);
      finishSignIn();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't verify the code. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh overflow-y-auto p-3 sm:p-4">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-5xl items-center justify-center sm:min-h-[calc(100dvh-2rem)]">
        <motion.section
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="grid w-full overflow-hidden rounded-3xl border border-white/85 bg-white/90 shadow-2xl shadow-brand-900/10 backdrop-blur-xl md:min-h-[calc(100dvh-2rem)] md:grid-cols-2"
        >
          <div className="relative hidden min-h-[600px] overflow-hidden md:block">
            <RouteMap />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/35 p-10 text-center backdrop-blur-[1px]">
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-700/20"
              >
                <MapPin className="h-7 w-7" aria-hidden="true" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-3xl font-bold tracking-tight text-brand-900"
              >
                NagarSetu
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mt-3 max-w-xs text-sm leading-6 text-slate-700"
              >
                A clearer path through civic services, grounded in official
                documents.
              </motion.p>
              <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-success-600" aria-hidden="true" />
                Your civic journey, made clearer
              </span>
            </div>
          </div>

          <div className="flex min-h-[600px] flex-col justify-center p-6 sm:p-10 lg:p-12">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-slate-600">Sign in to your NagarSetu account</p>

            <button
              type="button"
              disabled
              aria-label="Google sign-in coming soon"
              className="mt-8 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-600 opacity-75"
            >
              <span
                aria-hidden="true"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white font-bold text-brand-700"
              >
                G
              </span>
              Continue with Google
              <span className="text-xs text-slate-500">(coming soon)</span>
            </button>

            <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              <span className="h-px flex-1 bg-slate-200" />
              or use email
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            {challengeId ? (
              <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
                <div>
                  <label htmlFor="signin-authenticator-code" className="text-sm font-medium text-slate-800">
                    Authenticator code
                  </label>
                  <input
                    id="signin-authenticator-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={authenticatorCode}
                    onChange={(event) => {
                      setAuthenticatorCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setErrorMessage("");
                    }}
                    placeholder="Enter 6-digit code"
                    required
                    autoFocus
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm tracking-[0.3em] text-slate-900 outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Enter the current code from your authenticator app. This sign-in verification expires in 5 minutes.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || authenticatorCode.length !== 6}
                  className="h-12 w-full rounded-xl bg-brand-700 text-white hover:bg-brand-900"
                >
                  <span>{isSubmitting ? "Verifying..." : "Verify and sign in"}</span>
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setChallengeId(null);
                    setAuthenticatorCode("");
                    setErrorMessage("");
                  }}
                  className="w-full text-sm font-semibold text-brand-700 hover:underline"
                >
                  Back to password sign-in
                </button>
                <AnimatePresence>
                  {errorMessage && (
                    <motion.p
                      role="alert"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-800"
                    >
                      {errorMessage}
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="signin-email" className="text-sm font-medium text-slate-800">
                  Email address
                </label>
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="you@example.com"
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label htmlFor="signin-password" className="text-sm font-medium text-slate-800">
                  Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="Enter your password"
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm text-slate-900 outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-brand-700 text-white hover:bg-brand-900"
              >
                <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Button>

              <AnimatePresence>
                {errorMessage && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-800"
                  >
                    {errorMessage}
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
                Sign up
              </Link>
            </p>
            <p className="mt-6 text-center text-sm text-slate-600">
              Need help?{" "}
              <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
                Contact the NagarSetu team
              </Link>
            </p>
            <p className="mt-5 text-center text-xs text-slate-500">
              <Link href="/landing" className="hover:text-brand-700 hover:underline">
                Back to NagarSetu
              </Link>
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
