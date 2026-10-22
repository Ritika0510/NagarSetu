// "use client";

// import { useCallback, useEffect, useState } from "react";
// import Image from "next/image";
// import { ClipboardList, Github, Menu, MessageSquare, X } from "lucide-react";
// import { ChatPanel } from "@/components/ChatPanel";
// import { ChecklistCard } from "@/components/ChecklistCard";
// import { ProgressBar } from "@/components/ProgressBar";
// import {
//   SettingsSidebarAccordion,
//   type SettingsOption,
// } from "@/components/ui/settings-sidebar-accordion";
// import { SettingsCenter } from "@/components/ui/settings-center";
// import { DEMO_MODE, getSessionId } from "@/lib/api";
// import type { ChatResponse, Language } from "@/lib/types";
// import { cn } from "@/lib/utils";

// type MobileTab = "chat" | "checklist";

// const SETTINGS_OPTIONS: SettingsOption[] = [
//   "profile",
//   "display-name",
//   "email-address",
//   "language-region",
//   "password",
//   "two-factor-auth",
//   "active-sessions",
//   "login-history",
//   "email-alerts",
//   "push-notifications",
//   "digest-frequency",
//   "do-not-disturb",
//   "subscription-plan",
//   "payment-methods",
//   "invoices",
//   "usage-limits",
// ];

// function isSettingsOption(value: string | null): value is SettingsOption {
//   return value !== null && SETTINGS_OPTIONS.includes(value as SettingsOption);
// }

// const GITHUB_URL =
//   process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/Ritika0510/NagarSetu";
// const TAGLINE = "One app. Every civic need.";

// export default function Home() {
//   const [language, setLanguage] = useState<Language>("en");
//   const [mounted, setMounted] = useState(false);
//   const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [activeSetting, setActiveSetting] = useState<SettingsOption | null>(null);
//   const [latest, setLatest] = useState<ChatResponse | null>(null);
//   const [mobileProgress, setMobileProgress] = useState<{ completed: number; total: number } | null>(null);
//   const [sessionId] = useState(() =>
//     typeof window !== "undefined" ? getSessionId() : ""
//   );

//   useEffect(() => {
//     setMounted(true);
//     const requestedSetting = new URLSearchParams(window.location.search).get(
//       "settings"
//     );
//     if (isSettingsOption(requestedSetting)) {
//       setActiveSetting(requestedSetting);
//     }
//   }, []);

//   const handleChecklistUpdate = (response: ChatResponse) => {
//     setLatest(response);
//   };

//   const handleProgressChange = useCallback((completed: number, total: number) => {
//     setMobileProgress({ completed, total });
//   }, []);

//   const showGithub = mounted && !DEMO_MODE;
//   const totalSteps = latest ? latest.checklist.steps.length : 0;
//   const checklistLabel = latest
//     ? `Checklist (${mobileProgress?.completed ?? 0}/${totalSteps})`
//     : "Checklist";

//   const checklistPanel = latest ? (
//     <ChecklistCard
//       checklist={latest.checklist}
//       sources={latest.sources}
//       onProgressChange={handleProgressChange}
//     />
//   ) : (
//     <div className="flex h-full min-h-[300px] items-center justify-center rounded-card border border-dashed border-slate-200 bg-card p-8 text-center">
//       <p className="max-w-sm text-sm leading-[1.6] text-slate-600">
//         Describe what you need to do, for example &ldquo;I want to open a small shop in
//         Chandigarh&rdquo;, and I&apos;ll build your step-by-step checklist.
//       </p>
//     </div>
//   );

//   const tabs: Array<{ id: MobileTab; label: string; icon: typeof MessageSquare }> = [
//     { id: "chat", label: "Chat", icon: MessageSquare },
//     { id: "checklist", label: checklistLabel, icon: ClipboardList },
//   ];

//   return (
//     <div className="flex h-dvh flex-col bg-transparent lg:flex-row">
//       <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-slate-50/90 p-4 lg:block">
//         <SettingsSidebarAccordion onSelect={setActiveSetting} />
//       </aside>

//       <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
//         <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-sm">
//           <Image
//             src="/nagarsetu-logo-horizontal.svg"
//             alt="NagarSetu"
//             width={140}
//             height={32}
//             priority
//             className="h-8 w-auto"
//             style={{ width: "auto" }}
//           />

//           <div className="flex items-center gap-3">
//             <span className="hidden text-xs text-slate-500 sm:block">{TAGLINE}</span>
//             {showGithub && (
//               <a
//                 href={GITHUB_URL}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 aria-label="View NagarSetu on GitHub"
//                 className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors duration-150 ease-out hover:text-brand-700 sm:inline-flex"
//               >
//                 <Github aria-hidden="true" className="h-5 w-5" />
//               </a>
//             )}
//             {mounted && DEMO_MODE && (
//               <span className="rounded-md bg-accent-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-700">
//                 DEMO MODE
//               </span>
//             )}
//             <button
//               type="button"
//               onClick={() => setMenuOpen((open) => !open)}
//               aria-label={
//                 menuOpen ? "Close settings navigation" : "Open settings navigation"
//               }
//               aria-expanded={menuOpen}
//               aria-controls="dashboard-settings-navigation"
//               className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors duration-150 ease-out hover:text-slate-900 lg:hidden"
//             >
//               {menuOpen ? (
//                 <X aria-hidden="true" className="h-5 w-5" />
//               ) : (
//                 <Menu aria-hidden="true" className="h-5 w-5" />
//               )}
//             </button>
//           </div>

//           {menuOpen && (
//             <div
//               id="dashboard-settings-navigation"
//               className="absolute right-3 top-14 z-30 w-[min(20rem,calc(100vw-1.5rem))] animate-enter rounded-card border border-slate-200 bg-slate-50 p-3 shadow-xl lg:hidden"
//             >
//               <SettingsSidebarAccordion
//                 onSelect={(option) => {
//                   setActiveSetting(option);
//                   setMenuOpen(false);
//                 }}
//               />
//             </div>
//           )}
//         </header>

//         <div
//           role="tablist"
//           aria-label="Chat or checklist"
//           className="flex shrink-0 border-b border-slate-100 bg-white lg:hidden"
//         >
//           {tabs.map((tab) => {
//             const Icon = tab.icon;
//             const active = mobileTab === tab.id;
//             return (
//               <button
//                 key={tab.id}
//                 id={`tab-${tab.id}`}
//                 type="button"
//                 role="tab"
//                 aria-selected={active}
//                 aria-controls={`panel-${tab.id}`}
//                 onClick={() => setMobileTab(tab.id)}
//                 className={cn(
//                   "flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-sm font-medium transition-colors duration-150 ease-out",
//                   active
//                     ? "border-brand-700 text-brand-700"
//                     : "border-transparent text-slate-600 hover:text-slate-900"
//                 )}
//               >
//                 <Icon aria-hidden="true" className="h-4 w-4" />
//                 {tab.label}
//               </button>
//             );
//           })}
//         </div>

//         {/* One instance of each panel: CSS shows both on desktop and one at a time below 1024px. */}
//         <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-rows-[minmax(0,1fr)]">
//           <section
//             id="panel-chat"
//             role="tabpanel"
//             aria-labelledby="tab-chat"
//             className={cn(
//               "min-h-0 flex-1 overflow-hidden lg:block lg:h-full lg:flex-none lg:border-r lg:border-slate-100",
//               mobileTab === "chat" ? "block" : "hidden"
//             )}
//           >
//             <ChatPanel
//               sessionId={sessionId}
//               language={language}
//               onChecklistUpdate={handleChecklistUpdate}
//             />
//           </section>

//           <section
//             id="panel-checklist"
//             role="tabpanel"
//             aria-labelledby="tab-checklist"
//             className={cn(
//               "min-h-0 flex-1 overflow-y-auto p-4 lg:block lg:h-full lg:flex-none",
//               mobileTab === "checklist" ? "block" : "hidden"
//             )}
//           >
//             {checklistPanel}
//           </section>
//         </main>

//         {latest && mobileTab === "chat" && (
//           <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-2 lg:hidden">
//             <ProgressBar completed={mobileProgress?.completed ?? 0} total={totalSteps} />
//           </div>
//         )}
//       </div>
//         {activeSetting && (
//           <SettingsCenter
//             option={activeSetting}
//             onClose={() => {
//               setActiveSetting(null);
//               if (window.location.search.includes("settings=")) {
//                 window.history.replaceState({}, "", window.location.pathname);
//               }
//             }}
//             onLanguageChange={setLanguage}
//           />
//         )}
//     </div>
//   );
// }



"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  ClipboardList,
  Github,
  LogOut,
  Menu,
  MessageSquare,
  X,
} from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { ChecklistCard } from "@/components/ChecklistCard";
import { ProgressBar } from "@/components/ProgressBar";
import {
  SettingsSidebarAccordion,
  type SettingsOption,
} from "@/components/ui/settings-sidebar-accordion";
import { SettingsCenter } from "@/components/ui/settings-center";
import { DEMO_MODE, getSessionId } from "@/lib/api";
import type { ChatResponse, Language } from "@/lib/types";
import { cn } from "@/lib/utils";

type MobileTab = "chat" | "checklist";

const SETTINGS_OPTIONS: SettingsOption[] = [
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
  "subscription-plan",
  "payment-methods",
  "invoices",
  "usage-limits",
];

function isSettingsOption(value: string | null): value is SettingsOption {
  return value !== null && SETTINGS_OPTIONS.includes(value as SettingsOption);
}

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL?.trim() ||
  "https://github.com/Ritika0510/NagarSetu";

const TAGLINE = "One app. Every civic need.";

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSetting, setActiveSetting] =
    useState<SettingsOption | null>(null);
  const [latest, setLatest] = useState<ChatResponse | null>(null);
  const [mobileProgress, setMobileProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);

  const [sessionId] = useState(() =>
    typeof window !== "undefined" ? getSessionId() : ""
  );

  useEffect(() => {
    setMounted(true);

    const requestedSetting = new URLSearchParams(
      window.location.search
    ).get("settings");

    if (isSettingsOption(requestedSetting)) {
      setActiveSetting(requestedSetting);
    }
  }, []);

  const handleChecklistUpdate = (response: ChatResponse) => {
    setLatest(response);
  };

  const handleProgressChange = useCallback(
    (completed: number, total: number) => {
      setMobileProgress({ completed, total });
    },
    []
  );

  // Redirect to the sign-in page.
  // Connect your authentication logout function here if required.
  const handleSignOut = () => {
    window.location.href = "/signin";
  };

  const showGithub = mounted && !DEMO_MODE;

  const totalSteps = latest ? latest.checklist.steps.length : 0;

  const checklistLabel = latest
    ? `Checklist (${mobileProgress?.completed ?? 0}/${totalSteps})`
    : "Checklist";

  const checklistPanel = latest ? (
    <ChecklistCard
      checklist={latest.checklist}
      sources={latest.sources}
      onProgressChange={handleProgressChange}
    />
  ) : (
    <div className="flex h-full min-h-[300px] items-center justify-center rounded-card border border-dashed border-slate-200 bg-card p-8 text-center">
      <p className="max-w-sm text-sm leading-[1.6] text-slate-600">
        Describe what you need to do, for example &ldquo;I want to open a
        small shop in Chandigarh&rdquo;, and I&apos;ll build your step-by-step
        checklist.
      </p>
    </div>
  );

  const tabs: Array<{
    id: MobileTab;
    label: string;
    icon: typeof MessageSquare;
  }> = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "checklist", label: checklistLabel, icon: ClipboardList },
  ];

  return (
    <div className="flex h-dvh flex-col bg-transparent lg:flex-row">
      <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-slate-50/90 p-4 lg:block">
        <SettingsSidebarAccordion onSelect={setActiveSetting} />
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-sm">
          <Image
            src="/nagarsetu-logo-horizontal.svg"
            alt="NagarSetu"
            width={140}
            height={32}
            priority
            className="h-8 w-auto"
            style={{ width: "auto" }}
          />

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:block">
              {TAGLINE}
            </span>

            {showGithub && (
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View NagarSetu on GitHub"
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors duration-150 ease-out hover:text-brand-700 sm:inline-flex"
              >
                <Github aria-hidden="true" className="h-5 w-5" />
              </a>
            )}

            {mounted && DEMO_MODE && (
              <span className="rounded-md bg-accent-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-700">
                DEMO MODE
              </span>
            )}

            {/* Sign Out button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label="Sign out"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={
                menuOpen
                  ? "Close settings navigation"
                  : "Open settings navigation"
              }
              aria-expanded={menuOpen}
              aria-controls="dashboard-settings-navigation"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors duration-150 ease-out hover:text-slate-900 lg:hidden"
            >
              {menuOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>

          {menuOpen && (
            <div
              id="dashboard-settings-navigation"
              className="absolute right-3 top-14 z-30 w-[min(20rem,calc(100vw-1.5rem))] animate-enter rounded-card border border-slate-200 bg-slate-50 p-3 shadow-xl lg:hidden"
            >
              <SettingsSidebarAccordion
                onSelect={(option) => {
                  setActiveSetting(option);
                  setMenuOpen(false);
                }}
              />
            </div>
          )}
        </header>

        <div
          role="tablist"
          aria-label="Chat or checklist"
          className="flex shrink-0 border-b border-slate-100 bg-white lg:hidden"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = mobileTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setMobileTab(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-sm font-medium transition-colors duration-150 ease-out",
                  active
                    ? "border-brand-700 text-brand-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* One instance of each panel: CSS shows both on desktop and one at a time below 1024px. */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-rows-[minmax(0,1fr)]">
          <section
            id="panel-chat"
            role="tabpanel"
            aria-labelledby="tab-chat"
            className={cn(
              "min-h-0 flex-1 overflow-hidden lg:block lg:h-full lg:flex-none lg:border-r lg:border-slate-100",
              mobileTab === "chat" ? "block" : "hidden"
            )}
          >
            <ChatPanel
              sessionId={sessionId}
              language={language}
              onChecklistUpdate={handleChecklistUpdate}
            />
          </section>

          <section
            id="panel-checklist"
            role="tabpanel"
            aria-labelledby="tab-checklist"
            className={cn(
              "min-h-0 flex-1 overflow-y-auto p-4 lg:block lg:h-full lg:flex-none",
              mobileTab === "checklist" ? "block" : "hidden"
            )}
          >
            {checklistPanel}
          </section>
        </main>

        {latest && mobileTab === "chat" && (
          <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-2 lg:hidden">
            <ProgressBar
              completed={mobileProgress?.completed ?? 0}
              total={totalSteps}
            />
          </div>
        )}
      </div>

      {activeSetting && (
        <SettingsCenter
          option={activeSetting}
          onClose={() => {
            setActiveSetting(null);

            if (window.location.search.includes("settings=")) {
              window.history.replaceState(
                {},
                "",
                window.location.pathname
              );
            }
          }}
          onLanguageChange={setLanguage}
        />
      )}
    </div>
  );
}
