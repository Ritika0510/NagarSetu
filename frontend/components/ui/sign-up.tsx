"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  PartyPopper,
  Sparkles,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAccount } from "@/lib/auth";

type SignUpStep = "email" | "location" | "password" | "confirmPassword";
type SubmissionStatus = "closed" | "error" | "complete";

const glassButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/65 font-medium text-slate-800 shadow-sm backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        default: "px-6 py-3.5 text-base",
        sm: "px-4 py-2 text-sm",
        lg: "px-8 py-4 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { size: "default" },
  }
);

interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, contentClassName, children, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(glassButtonVariants({ size }), className, contentClassName)}
      {...props}
    >
      {children}
    </button>
  )
);
GlassButton.displayName = "GlassButton";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function BlurFade({ children, className, delay = 0 }: BlurFadeProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const variants: Variants = {
    hidden: { y: 8, opacity: 0, filter: "blur(6px)" },
    visible: { y: 0, opacity: 1, filter: "blur(0px)" },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AuthComponentProps {
  logo?: React.ReactNode;
  brandName?: string;
}

export function AuthComponent({
  logo,
  brandName = "NagarSetu",
}: AuthComponentProps) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [step, setStep] = React.useState<SignUpStep>("email");
  const [submissionStatus, setSubmissionStatus] =
    React.useState<SubmissionStatus>("closed");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const addressInputRef = React.useRef<HTMLInputElement>(null);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = React.useRef<HTMLInputElement>(null);
  const confettiCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const emailIsValid = /^\S+@\S+\.\S+$/.test(email);
  const locationIsValid =
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    state.trim().length > 0 &&
    postalCode.trim().length >= 3;
  const passwordIsValid = password.length >= 8;
  const confirmPasswordIsValid = confirmPassword.length >= 8;

  const fireConfetti = React.useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const fire = confetti.create(canvas, { resize: true, useWorker: true });
    const options = {
      startVelocity: 28,
      spread: 360,
      ticks: 55,
      zIndex: 100,
      particleCount: 45,
    };
    void fire({ ...options, origin: { x: 0.08, y: 0.9 }, angle: 60 });
    void fire({ ...options, origin: { x: 0.92, y: 0.9 }, angle: 120 });
  }, []);

  React.useEffect(() => {
    const input =
      step === "location"
        ? addressInputRef.current
        : step === "password"
          ? passwordInputRef.current
          : step === "confirmPassword"
            ? confirmPasswordInputRef.current
            : null;
    if (!input) return;

    const timeout = window.setTimeout(() => input.focus(), 250);
    return () => window.clearTimeout(timeout);
  }, [step]);

  React.useEffect(() => {
    if (submissionStatus !== "complete") return;
    fireConfetti();
  }, [fireConfetti, submissionStatus]);

  const advanceStep = React.useCallback(() => {
    if (step === "email" && fullName.trim() && emailIsValid) setStep("location");
    if (step === "location" && locationIsValid) setStep("password");
    if (step === "password" && passwordIsValid) setStep("confirmPassword");
  }, [emailIsValid, fullName, locationIsValid, passwordIsValid, step]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && step !== "confirmPassword") {
      event.preventDefault();
      advanceStep();
    }
  };

  const goBack = () => {
    if (step === "confirmPassword") {
      setStep("password");
      setConfirmPassword("");
    } else if (step === "password") {
      setStep("location");
    } else if (step === "location") {
      setStep("email");
    }
  };

  const closeModal = () => {
    setSubmissionStatus("closed");
    setErrorMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step !== "confirmPassword" || submissionStatus !== "closed" || isSubmitting) return;

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match. Please try again.");
      setSubmissionStatus("error");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerAccount({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
      });
      setSubmissionStatus("complete");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't create your account. Please try again."
      );
      setSubmissionStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepContent: Record<SignUpStep, { title: string; description: string }> = {
    email: {
      title: "Get started with NagarSetu",
      description: "Create your account with your name and email address.",
    },
    location: {
      title: "Register your workspace",
      description: "Add your address so we can tailor civic guidance to your area.",
    },
    password: {
      title: "Create your password",
      description: "Choose a password with at least 8 characters.",
    },
    confirmPassword: {
      title: "One last step",
      description: "Confirm your password to finish creating your account.",
    },
  };

  const transition: Transition = { duration: 0.3, ease: "easeOut" };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-slate-900">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-[-8rem] h-80 w-80 rounded-full bg-brand-100/70 blur-3xl"
        animate={
          prefersReducedMotion
            ? { x: 0, y: 0 }
            : { x: [0, 18, 0], y: [0, -14, 0] }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 18, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-[-7rem] h-80 w-80 rounded-full bg-accent-100/75 blur-3xl"
        animate={
          prefersReducedMotion
            ? { x: 0, y: 0 }
            : { x: [0, -16, 0], y: [0, 16, 0] }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 22, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <canvas
        ref={confettiCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[80] h-full w-full"
      />

      <section className="relative z-10 w-full max-w-lg rounded-[28px] border border-white/85 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-10">
        <div className="mb-8 flex items-center justify-center gap-3">
          {logo ?? (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <span className="text-lg font-bold tracking-tight text-slate-900">
            {brandName}
          </span>
        </div>

        <div className="mb-7 rounded-xl border border-accent-500/30 bg-accent-50 px-4 py-3 text-center text-sm text-slate-700">
          Your name, email, and workspace address are saved to create your
          account. Your password is securely hashed and never stored as plain text.
        </div>

        <div className="mx-auto flex max-w-[420px] flex-col items-center gap-4 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={transition}
              className="w-full"
            >
              <BlurFade>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {stepContent[step].title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {stepContent[step].description}
                </p>
              </BlurFade>
            </motion.div>
          </AnimatePresence>

          {step === "email" && (
            <>
              <p className="text-sm font-medium text-slate-600">
                Continue with
              </p>
              <div className="flex w-full gap-3">
                <GlassButton type="button" size="sm" disabled className="flex-1">
                  Google <span className="text-xs text-slate-500">Coming soon</span>
                </GlassButton>
                <GlassButton type="button" size="sm" disabled className="flex-1">
                  GitHub <span className="text-xs text-slate-500">Coming soon</span>
                </GlassButton>
              </div>
              <div className="flex w-full items-center gap-3 text-xs font-semibold text-slate-500">
                <hr className="flex-1 border-slate-200" />
                OR
                <hr className="flex-1 border-slate-200" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {step !== "confirmPassword" ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={transition}
                  className="space-y-4"
                >
                  {step === "email" ? (
                    <div className="space-y-4">
                      <label className="block space-y-1.5 text-left">
                        <span className="text-sm font-medium text-slate-700">
                          Full name
                        </span>
                        <input
                          type="text"
                          autoComplete="name"
                          placeholder="Your full name"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          required
                          maxLength={120}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-brand-700"
                        />
                      </label>
                      <label className="flex h-14 items-center gap-3 rounded-2xl border border-white bg-white/70 px-4 shadow-sm backdrop-blur-md focus-within:ring-2 focus-within:ring-brand-700">
                        <Mail className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                        <span className="sr-only">Email address</span>
                        <input
                          type="email"
                          autoComplete="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          onKeyDown={handleKeyDown}
                          required
                          aria-invalid={email.length > 0 && !emailIsValid}
                          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
                        />
                        <GlassButton
                          type="button"
                          size="icon"
                          onClick={advanceStep}
                          disabled={!fullName.trim() || !emailIsValid}
                          aria-label="Continue with email"
                        >
                          <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </GlassButton>
                      </label>
                    </div>
                  ) : step === "location" ? (
                    <div className="space-y-4 text-left">
                      <label className="block space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">
                          Street address
                        </span>
                        <input
                          ref={addressInputRef}
                          type="text"
                          autoComplete="street-address"
                          placeholder="Street and house number"
                          value={address}
                          onChange={(event) => setAddress(event.target.value)}
                          onKeyDown={handleKeyDown}
                          required
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-brand-700"
                        />
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">
                            City
                          </span>
                          <input
                            type="text"
                            autoComplete="address-level2"
                            placeholder="City"
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                            onKeyDown={handleKeyDown}
                            required
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-brand-700"
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">
                            State
                          </span>
                          <input
                            type="text"
                            autoComplete="address-level1"
                            placeholder="State"
                            value={state}
                            onChange={(event) => setState(event.target.value)}
                            onKeyDown={handleKeyDown}
                            required
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-brand-700"
                          />
                        </label>
                      </div>
                      <label className="block space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">
                          Postal code
                        </span>
                        <input
                          type="text"
                          autoComplete="postal-code"
                          inputMode="numeric"
                          placeholder="Postal code"
                          value={postalCode}
                          onChange={(event) => setPostalCode(event.target.value)}
                          onKeyDown={handleKeyDown}
                          required
                          minLength={3}
                          maxLength={12}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-brand-700"
                        />
                      </label>
                      <GlassButton
                        type="button"
                        onClick={advanceStep}
                        disabled={!locationIsValid}
                        className="w-full"
                      >
                        Continue
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                      </GlassButton>
                    </div>
                  ) : (
                    <label className="flex h-14 items-center gap-3 rounded-2xl border border-white bg-white/70 px-4 shadow-sm backdrop-blur-md focus-within:ring-2 focus-within:ring-brand-700">
                      <Lock className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                      <span className="sr-only">Password</span>
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Password (at least 8 characters)"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onKeyDown={handleKeyDown}
                        required
                        minLength={8}
                        className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="rounded-full p-2 text-slate-500 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                      <GlassButton
                        type="button"
                        size="icon"
                        onClick={advanceStep}
                        disabled={!passwordIsValid}
                        aria-label="Continue to password confirmation"
                      >
                        <ArrowRight className="h-5 w-5" aria-hidden="true" />
                      </GlassButton>
                    </label>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transition}
                className="space-y-4"
              >
                <label className="flex h-14 items-center gap-3 rounded-2xl border border-white bg-white/70 px-4 shadow-sm backdrop-blur-md focus-within:ring-2 focus-within:ring-brand-700">
                  <Lock className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                  <span className="sr-only">Confirm password</span>
                  <input
                    ref={confirmPasswordInputRef}
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    className="rounded-full p-2 text-slate-500 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                  <GlassButton
                    type="submit"
                    size="icon"
                    disabled={!confirmPasswordIsValid || isSubmitting}
                    aria-label="Create account"
                  >
                    {isSubmitting ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    )}
                  </GlassButton>
                </label>
              </motion.div>
            )}

            {step !== "email" && (
              <button
                type="button"
                onClick={goBack}
                className="mx-auto flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Go back
              </button>
            )}
          </form>
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <AnimatePresence>
        {submissionStatus !== "closed" && (
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="signup-status-modal-title"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/80 bg-white p-8 text-center shadow-2xl"
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close account status message"
                className="absolute right-3 top-3 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>

              {submissionStatus === "error" ? (
                <>
                  <AlertCircle
                    className="h-12 w-12 text-amber-600"
                    aria-hidden="true"
                  />
                  <h2
                    id="signup-status-modal-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    {errorMessage === "The passwords do not match. Please try again."
                      ? "Please check the form"
                      : "We couldn't create your account"}
                  </h2>
                  <p role="alert" className="text-sm text-slate-600">
                    {errorMessage}
                  </p>
                </>
              ) : (
                <>
                  <PartyPopper
                    className="h-12 w-12 text-success-600"
                    aria-hidden="true"
                  />
                  <h2
                    id="signup-status-modal-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Account created
                  </h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Your NagarSetu account is ready. You can now start exploring
                    civic services.
                  </p>
                </>
              )}
              {submissionStatus === "error" ? (
                <GlassButton type="button" size="sm" onClick={closeModal}>
                  Try again
                </GlassButton>
              ) : (
                <GlassButton
                  type="button"
                  size="sm"
                  onClick={() => router.push("/")}
                >
                  Open NagarSetu
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </GlassButton>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
