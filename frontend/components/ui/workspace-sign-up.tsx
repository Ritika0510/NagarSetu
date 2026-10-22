"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerAccount } from "@/lib/auth";

const inputClass =
  "mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-brand-700 focus-visible:ring-2 focus-visible:ring-brand-100";

export function WorkspaceSignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match. Please check and try again.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await registerAccount({
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        password,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
      });
      setAccountCreated(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't create your account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accountCreated) {
    return (
      <div
        role="status"
        className="mx-auto w-full max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-12"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <ArrowRight aria-hidden="true" className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
          Your NagarSetu account is ready
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          You can now open the app and start exploring civic services.
        </p>
        <Button
          asChild
          className="mt-7 h-11 rounded-md bg-brand-700 px-6 text-white hover:bg-brand-900"
        >
          <Link href="/">
            Open NagarSetu <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm sm:p-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
          NagarSetu account
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Register to NagarSetu
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create an account to keep your civic guidance close at hand.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="first-name" className="text-sm font-medium text-slate-800">
              First name <span className="text-red-500">*</span>
            </label>
            <input
              id="first-name"
              name="first-name"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              className={inputClass}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              maxLength={60}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="last-name" className="text-sm font-medium text-slate-800">
              Last name <span className="text-red-500">*</span>
            </label>
            <input
              id="last-name"
              name="last-name"
              type="text"
              autoComplete="family-name"
              placeholder="Last name"
              className={inputClass}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              maxLength={60}
              required
            />
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="register-email" className="text-sm font-medium text-slate-800">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              className={inputClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              required
            />
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="register-address" className="text-sm font-medium text-slate-800">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              id="register-address"
              name="address"
              type="text"
              autoComplete="street-address"
              placeholder="House number and street"
              className={inputClass}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="register-city" className="text-sm font-medium text-slate-800">
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="register-city"
              name="city"
              type="text"
              autoComplete="address-level2"
              placeholder="City"
              className={inputClass}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="register-state" className="text-sm font-medium text-slate-800">
              State <span className="text-red-500">*</span>
            </label>
            <input
              id="register-state"
              name="state"
              type="text"
              autoComplete="address-level1"
              placeholder="State"
              className={inputClass}
              value={state}
              onChange={(event) => setState(event.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="register-postal-code" className="text-sm font-medium text-slate-800">
              Postal code <span className="text-red-500">*</span>
            </label>
            <input
              id="register-postal-code"
              name="postal-code"
              type="text"
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder="Postal code"
              className={inputClass}
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              minLength={3}
              maxLength={20}
              required
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="register-password" className="text-sm font-medium text-slate-800">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={inputClass}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="register-confirm-password" className="text-sm font-medium text-slate-800">
              Confirm password <span className="text-red-500">*</span>
            </label>
            <input
              id="register-confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter password"
              className={inputClass}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
          </div>
        </div>

        <div className="my-6 border-t border-slate-200" />
        {errorMessage && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
          >
            {errorMessage}
          </p>
        )}
        <div className="flex flex-col-reverse items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <Link
            href="/signin"
            className="text-center text-sm font-medium text-brand-700 hover:underline sm:text-left"
          >
            Already have an account? Sign in
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 rounded-md bg-brand-700 px-6 text-white hover:bg-brand-900"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
            <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-500">
          Your contact and workspace details are saved to your account. Your password is securely
          hashed and never stored as plain text.
        </p>
      </form>
    </section>
  );
}
