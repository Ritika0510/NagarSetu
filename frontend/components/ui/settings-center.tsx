"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  beginTwoFactorSetup,
  changeAccountPassword,
  disableTwoFactor,
  enableTwoFactor,
  getAccountPreferences,
  getAccountSessions,
  getCurrentAccount,
  getLoginHistory,
  getTwoFactorStatus,
  revokeAccountSession,
  saveAccountPreferences,
  updateAccountProfile,
  type AccountDetails,
  type AccountPreferences,
  type AccountSession,
  type LoginEvent,
  type TwoFactorSetup,
} from "@/lib/auth";
import type { SettingsOption } from "@/components/ui/settings-sidebar-accordion";
import { cn } from "@/lib/utils";

const DEFAULT_PREFERENCES: AccountPreferences = {
  language: "en",
  email_alerts: true,
  push_notifications: false,
  digest_frequency: "daily",
  do_not_disturb: false,
};

const OPTION_TITLES: Record<SettingsOption, string> = {
  profile: "Profile",
  "display-name": "Display name",
  "email-address": "Email address",
  "language-region": "Language & region",
  password: "Password",
  "two-factor-auth": "Two-factor authentication",
  "active-sessions": "Active sessions",
  "login-history": "Login history",
  "email-alerts": "Email alerts",
  "push-notifications": "Push notifications",
  "digest-frequency": "Digest frequency",
  "do-not-disturb": "Do not disturb",
  "subscription-plan": "Subscription plan",
  "payment-methods": "Payment methods",
  invoices: "Invoices",
  "usage-limits": "Usage & limits",
};

const ACCOUNT_OPTIONS: SettingsOption[] = [
  "profile",
  "display-name",
  "email-address",
  "language-region",
  "password",
  "two-factor-auth",
  "active-sessions",
  "login-history",
  "email-alerts",
  "push-notifications",
  "digest-frequency",
  "do-not-disturb",
];

const inputClass =
  "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-100";

function Field({
  label,
  name,
  value,
  onChange,
  required = true,
  type = "text",
  readOnly = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        type={type}
        readOnly={readOnly}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function SaveButton({ children = "Save changes" }: { children?: ReactNode }) {
  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
      type="submit"
    >
      {children}
    </button>
  );
}

export function SettingsCenter({
  option,
  onClose,
  onLanguageChange,
}: {
  option: SettingsOption;
  onClose: () => void;
  onLanguageChange: (language: AccountPreferences["language"]) => void;
}) {
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [preferences, setPreferences] =
    useState<AccountPreferences>(DEFAULT_PREFERENCES);
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [history, setHistory] = useState<LoginEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorPassword, setTwoFactorPassword] = useState("");

  useEffect(() => {
    if (option !== "two-factor-auth") return;
    let active = true;
    setTwoFactorLoading(true);
    getTwoFactorStatus()
      .then(({ enabled }) => {
        if (active) setTwoFactorEnabled(enabled);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load two-factor authentication status."
        );
      })
      .finally(() => {
        if (active) setTwoFactorLoading(false);
      });
    return () => {
      active = false;
    };
  }, [option]);

  useEffect(() => {
    let active = true;
    setError("");
    if (!ACCOUNT_OPTIONS.includes(option)) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    Promise.all([getCurrentAccount(), getAccountPreferences()])
      .then(([user, savedPreferences]) => {
        if (!active) return;
        setAccount(user);
        setFullName(user.full_name);
        setAddress(user.address);
        setCity(user.city);
        setState(user.state);
        setPostalCode(user.postal_code);
        setPreferences(savedPreferences);
        onLanguageChange(savedPreferences.language);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load your account settings."
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onLanguageChange, option]);

  useEffect(() => {
    if (option === "active-sessions") {
      getAccountSessions()
        .then(setSessions)
        .catch((requestError: unknown) =>
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load active sessions."
          )
        );
    }
    if (option === "login-history") {
      getLoginHistory()
        .then(setHistory)
        .catch((requestError: unknown) =>
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load login history."
          )
        );
    }
  }, [option]);

  const runSave = async (action: () => Promise<void>): Promise<void> => {
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      await action();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Your changes could not be saved."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSave(async () => {
      const updated = await updateAccountProfile({
        full_name: fullName,
        address,
        city,
        state,
        postal_code: postalCode,
      });
      setAccount(updated);
      setNotice("Your profile was updated.");
    });
  };

  const handleNameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!account) return;
    void runSave(async () => {
      const updated = await updateAccountProfile({
        full_name: fullName,
        address: account.address,
        city: account.city,
        state: account.state,
        postal_code: account.postal_code,
      });
      setAccount(updated);
      setNotice("Your display name was updated.");
    });
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("The new password and confirmation do not match.");
      return;
    }
    void runSave(async () => {
      await changeAccountPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Password changed. Other active sessions have been signed out.");
    });
  };

  const handleBeginTwoFactorSetup = (): void => {
    void runSave(async () => {
      const setup = await beginTwoFactorSetup();
      setTwoFactorSetup(setup);
      setTwoFactorCode("");
      setNotice("Add this key to your authenticator app, then enter its 6-digit code.");
    });
  };

  const handleEnableTwoFactor = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void runSave(async () => {
      await enableTwoFactor(twoFactorCode);
      setTwoFactorEnabled(true);
      setTwoFactorSetup(null);
      setTwoFactorCode("");
      setNotice("Two-factor authentication is enabled for your account.");
    });
  };

  const handleDisableTwoFactor = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void runSave(async () => {
      await disableTwoFactor(twoFactorPassword, twoFactorCode);
      setTwoFactorEnabled(false);
      setTwoFactorPassword("");
      setTwoFactorCode("");
      setTwoFactorSetup(null);
      setNotice("Two-factor authentication has been disabled.");
    });
  };

  const updatePreferences = (
    next: AccountPreferences,
    successMessage: string
  ) => {
    void runSave(async () => {
      const saved = await saveAccountPreferences(next);
      setPreferences(saved);
      onLanguageChange(saved.language);
      setNotice(successMessage);
    });
  };

  const handlePushNotification = async (enabled: boolean) => {
    if (enabled && !("Notification" in window)) {
      setError("This browser does not support notifications.");
      return;
    }
    if (enabled && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Browser notification permission was not granted.");
        return;
      }
    }
    const next = { ...preferences, push_notifications: enabled };
    updatePreferences(
      next,
      enabled
        ? "Browser notifications are enabled on this device."
        : "Browser notifications are disabled."
    );
    if (enabled && Notification.permission === "granted") {
      new Notification("NagarSetu notifications enabled", {
        body: "This browser can now show NagarSetu notifications while the app is open.",
      });
    }
  };

  const handleRevokeSession = (session: AccountSession) => {
    void runSave(async () => {
      await revokeAccountSession(session.id);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      setNotice("The selected session was signed out.");
    });
  };

  const preferenceToggle = (
    key: "email_alerts" | "do_not_disturb",
    label: string,
    description: string
  ) => (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={preferences[key]}
        onChange={(event) =>
          updatePreferences(
            { ...preferences, [key]: event.target.checked },
            `${label} preference saved.`
          )
        }
        className="mt-1 h-4 w-4 accent-brand-700"
      />
    </label>
  );

  const content: Record<SettingsOption, ReactNode> = {
    profile: (
      <form className="space-y-4" onSubmit={handleProfileSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="settings-full-name" value={fullName} onChange={setFullName} />
          <Field label="Email address" name="settings-profile-email" value={account?.email ?? ""} onChange={() => undefined} required={false} readOnly type="email" />
          <Field label="Street address" name="settings-address" value={address} onChange={setAddress} />
          <Field label="City" name="settings-city" value={city} onChange={setCity} />
          <Field label="State / region" name="settings-state" value={state} onChange={setState} />
          <Field label="Postal code" name="settings-postal-code" value={postalCode} onChange={setPostalCode} />
        </div>
        <p className="text-xs text-slate-500">
          Email changes require address verification. Use the Email Address option to request a change.
        </p>
        <SaveButton>{isSaving ? "Saving..." : "Save profile"}</SaveButton>
      </form>
    ),
    "display-name": (
      <form className="max-w-lg space-y-4" onSubmit={handleNameSubmit}>
        <Field label="Display name" name="settings-display-name" value={fullName} onChange={setFullName} />
        <p className="text-sm text-slate-600">
          This name appears on your NagarSetu account.
        </p>
        <SaveButton>{isSaving ? "Saving..." : "Save display name"}</SaveButton>
      </form>
    ),
    "email-address": (
      <div className="max-w-xl space-y-4">
        <Field label="Current email address" name="settings-email" value={account?.email ?? ""} onChange={() => undefined} required={false} readOnly type="email" />
        <p className="text-sm leading-6 text-slate-600">
          Email addresses are used to sign in. To protect your account, changing
          the address requires verification of the new email address.
        </p>
        <Link className="inline-flex min-h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-900" href="/contact">
          Request an email change
        </Link>
      </div>
    ),
    "language-region": (
      <div className="max-w-lg space-y-5">
        <label className="block text-sm font-medium text-slate-700" htmlFor="settings-language">
          Language
          <select
            id="settings-language"
            className={inputClass}
            value={preferences.language}
            onChange={(event) =>
              updatePreferences(
                { ...preferences, language: event.target.value as "en" | "hi" },
                "Language preference saved."
              )
            }
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            This preference is saved to your account. Digest delivery is not configured in this deployment.
          </p>
        </label>
        <p className="text-sm leading-6 text-slate-600">
          Your region is taken from your saved profile address:{" "}
          <strong>{account ? `${account.city}, ${account.state}` : "Not set"}</strong>.
          Update it in Profile.
        </p>
      </div>
    ),
    password: (
      <form className="max-w-lg space-y-4" onSubmit={handlePasswordSubmit}>
        <Field label="Current password" name="settings-current-password" value={currentPassword} onChange={setCurrentPassword} type="password" />
        <Field label="New password" name="settings-new-password" value={newPassword} onChange={setNewPassword} type="password" />
        <Field label="Confirm new password" name="settings-confirm-password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
        <p className="text-xs text-slate-500">Use at least 8 characters. Changing your password signs out other active sessions.</p>
        <SaveButton>{isSaving ? "Updating..." : "Update password"}</SaveButton>
      </form>
    ),
    "two-factor-auth": (
      twoFactorLoading ? (
        <p className="text-sm text-slate-600" role="status">Checking two-factor status...</p>
      ) : twoFactorEnabled ? (
        <div className="max-w-xl space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="font-semibold text-slate-900">Two-factor authentication is enabled</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Sign-ins require a current code from your authenticator app. Keep access to that app to avoid losing account access.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleDisableTwoFactor}>
            <Field
              label="Current password"
              name="settings-disable-2fa-password"
              value={twoFactorPassword}
              onChange={setTwoFactorPassword}
              type="password"
            />
            <Field
              label="Authenticator code"
              name="settings-disable-2fa-code"
              value={twoFactorCode}
              onChange={(value) => setTwoFactorCode(value.replace(/\D/g, "").slice(0, 6))}
              type="text"
            />
            <button
              type="submit"
              disabled={isSaving || twoFactorCode.length !== 6}
              className="min-h-10 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Updating..." : "Disable two-factor authentication"}
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-xl space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Protect your account with an authenticator app</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use an authenticator app to generate a fresh 6-digit sign-in code. You&apos;ll verify the app before protection is enabled.
            </p>
          </div>
          {!twoFactorSetup ? (
            <button
              type="button"
              onClick={handleBeginTwoFactorSetup}
              disabled={isSaving}
              className="min-h-10 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Preparing setup..." : "Set up authenticator"}
            </button>
          ) : (
            <form className="space-y-4" onSubmit={handleEnableTwoFactor}>
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Add this key to your authenticator app</p>
                <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-sm tracking-wider text-brand-900">
                  {twoFactorSetup.secret}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Choose manual setup in your app, then enter the current code below. Keep this key private.
                </p>
              </div>
              <Field
                label="6-digit authenticator code"
                name="settings-enable-2fa-code"
                value={twoFactorCode}
                onChange={(value) => setTwoFactorCode(value.replace(/\D/g, "").slice(0, 6))}
                type="text"
              />
              <div className="flex flex-wrap gap-3">
                <SaveButton>{isSaving ? "Verifying..." : "Verify and enable"}</SaveButton>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorSetup(null);
                    setTwoFactorCode("");
                  }}
                  className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )
    ),
    "active-sessions": (
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-600">No active sessions were found.</p>
        ) : (
          sessions.map((session) => (
            <article key={session.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {session.is_current ? "This device (current session)" : session.user_agent || "Other device"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Signed in {session.created_at || "before session tracking was added"}
                  {session.remote_address ? ` · ${session.remote_address}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">Expires {session.expires_at}</p>
              </div>
              {!session.is_current && (
                <button className="min-h-9 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => handleRevokeSession(session)} type="button">
                  Sign out this device
                </button>
              )}
            </article>
          ))
        )}
      </div>
    ),
    "login-history": (
      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-sm text-slate-600">No sign-in history is available yet.</p>
        ) : (
          history.map((entry) => (
            <article key={`${entry.logged_in_at}-${entry.remote_address}`} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{entry.logged_in_at}</p>
              <p className="mt-1 text-xs text-slate-600">
                {entry.remote_address || "Location unavailable"}
                {entry.user_agent ? ` · ${entry.user_agent}` : ""}
              </p>
            </article>
          ))
        )}
      </div>
    ),
    "email-alerts": (
      <div className="max-w-xl space-y-4">
        {preferenceToggle(
          "email_alerts",
          "Email alerts",
          "Save whether you want NagarSetu account updates sent by email."
        )}
        <p className="text-xs leading-5 text-slate-500">
          Your preference is saved to your account. Outbound email delivery is not configured in this deployment.
        </p>
      </div>
    ),
    "push-notifications": (
      <div className="max-w-xl space-y-4">
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <span>
            <span className="block text-sm font-semibold text-slate-900">Browser notifications</span>
            <span className="mt-1 block text-sm leading-5 text-slate-600">
              Allow this browser to show NagarSetu notifications while the app is open.
            </span>
          </span>
          <input
            type="checkbox"
            checked={preferences.push_notifications}
            onChange={(event) => void handlePushNotification(event.target.checked)}
            className="mt-1 h-4 w-4 accent-brand-700"
          />
        </label>
        <p className="text-xs text-slate-500">
          This uses the browser permission on this device; background push delivery is not configured.
        </p>
      </div>
    ),
    "digest-frequency": (
      <label className="block max-w-lg text-sm font-medium text-slate-700" htmlFor="settings-digest">
        Email digest frequency
        <select
          id="settings-digest"
          className={inputClass}
          value={preferences.digest_frequency}
          onChange={(event) =>
            updatePreferences(
              {
                ...preferences,
                digest_frequency: event.target.value as AccountPreferences["digest_frequency"],
              },
              "Digest frequency saved."
            )
          }
        >
          <option value="immediate">Immediately</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="never">Never</option>
        </select>
      </label>
    ),
    "do-not-disturb": (
      <div className="max-w-xl">
        {preferenceToggle(
          "do_not_disturb",
          "Do not disturb",
          "Save a preference to pause non-essential account alerts."
        )}
        <p className="mt-3 text-xs leading-5 text-slate-500">
          This setting is stored with your account preferences; scheduled notification delivery is not enabled.
        </p>
      </div>
    ),
    "subscription-plan": (
      <article className="max-w-xl rounded-xl border border-brand-100 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Current plan</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-900">Free</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          NagarSetu currently has no paid subscriptions or recurring charges.
        </p>
      </article>
    ),
    "payment-methods": (
      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">No payment methods saved</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The current Free plan does not collect payments, and no card or bank
          details are stored. Payment collection is not configured.
        </p>
      </div>
    ),
    invoices: (
      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">No invoices</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          There are no invoices because NagarSetu currently has no paid plan or charges.
        </p>
      </div>
    ),
    "usage-limits": (
      <div className="max-w-xl space-y-3">
        <p className="text-sm leading-6 text-slate-600">
          NagarSetu does not currently apply account-level usage quotas. Usage
          limits will be shown here if a metered plan is introduced.
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Plan limit</p>
          <p className="mt-1 text-sm text-slate-600">No account quota configured</p>
        </div>
      </div>
    ),
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-3 sm:p-6"
      role="presentation"
    >
      <section
        aria-labelledby="settings-center-title"
        aria-modal="true"
        className="flex max-h-[min(90dvh,56rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl"
        role="dialog"
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Settings</p>
            <h2 id="settings-center-title" className="mt-1 text-xl font-bold text-slate-900">
              {OPTION_TITLES[option]}
            </h2>
          </div>
          <button
            aria-label="Close settings"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="text-2xl leading-none">×</span>
          </button>
        </header>
        <div className="overflow-y-auto p-5 sm:p-7">
          {isLoading && (
            <p className="mb-4 text-sm text-slate-600" role="status">Loading account settings...</p>
          )}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
              {(error.includes("sign in") || error.includes("session has expired")) && (
                <span className="ml-2">
                  <Link
                    className="font-semibold underline hover:text-red-950"
                    href={`/signin?next=${encodeURIComponent(`/?settings=${option}`)}`}
                  >
                    Sign in
                  </Link>
                  <span className="mx-1 text-slate-400">or</span>
                  <Link
                    className="font-semibold underline hover:text-red-950"
                    href="/signup"
                  >
                    Create account
                  </Link>
                </span>
              )}
            </div>
          )}
          {notice && (
            <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
              {notice}
            </p>
          )}
          {!isLoading && content[option]}
        </div>
      </section>
    </div>
  );
}
