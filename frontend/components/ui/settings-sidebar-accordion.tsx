import {
  BellIcon,
  CreditCardIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SettingsOption =
  | "profile"
  | "display-name"
  | "email-address"
  | "language-region"
  | "password"
  | "two-factor-auth"
  | "active-sessions"
  | "login-history"
  | "email-alerts"
  | "push-notifications"
  | "digest-frequency"
  | "do-not-disturb"
  | "subscription-plan"
  | "payment-methods"
  | "invoices"
  | "usage-limits";

const sections: Array<{
  icon: LucideIcon;
  label: string;
  links: Array<{ label: string; value: SettingsOption }>;
  value: string;
}> = [
  {
    icon: UserIcon,
    label: "Account",
    links: [
      { label: "Profile", value: "profile" },
      { label: "Display Name", value: "display-name" },
      { label: "Email Address", value: "email-address" },
      { label: "Language & Region", value: "language-region" },
    ],
    value: "account",
  },
  {
    icon: ShieldIcon,
    label: "Security",
    links: [
      { label: "Password", value: "password" },
      { label: "Two-Factor Auth", value: "two-factor-auth" },
      { label: "Active Sessions", value: "active-sessions" },
      { label: "Login History", value: "login-history" },
    ],
    value: "security",
  },
  {
    icon: BellIcon,
    label: "Notifications",
    links: [
      { label: "Email Alerts", value: "email-alerts" },
      { label: "Push Notifications", value: "push-notifications" },
      { label: "Digest Frequency", value: "digest-frequency" },
      { label: "Do Not Disturb", value: "do-not-disturb" },
    ],
    value: "notifications",
  },
  {
    icon: CreditCardIcon,
    label: "Billing",
    links: [
      { label: "Subscription Plan", value: "subscription-plan" },
      { label: "Payment Methods", value: "payment-methods" },
      { label: "Invoices", value: "invoices" },
      { label: "Usage & Limits", value: "usage-limits" },
    ],
    value: "billing",
  },
];

export function SettingsSidebarAccordion({
  onSelect,
}: {
  onSelect?: (option: SettingsOption) => void;
}) {
  const handleSelect = (option: SettingsOption): void => {
    if (onSelect) {
      onSelect(option);
      return;
    }
    window.location.assign(`/?settings=${encodeURIComponent(option)}`);
  };

  return (
    <nav
      aria-label="Settings navigation"
      className="w-full rounded-xl border border-slate-200 bg-white p-4"
    >
      <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Settings
      </p>
      <div className="space-y-1">
        {sections.map(({ icon: Icon, label, value, links }) => (
          <details className="group" key={value} open={value === "account"}>
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2.5">
                <Icon
                  aria-hidden="true"
                  className="h-4 w-4 text-slate-500"
                />
                <span className="text-sm font-medium text-slate-900">
                  {label}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-xs text-slate-400 transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <ul className="ml-6 flex flex-col gap-0.5 border-l border-slate-200 pl-3 pb-1">
              {links.map((link) => (
                <li key={link.value}>
                  <button
                    className="block w-full rounded-sm py-1.5 pr-1 text-left text-sm text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                    onClick={() => handleSelect(link.value)}
                    type="button"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </nav>
  );
}
