"use client";

// import { useState } from "react";
import { useEffect, useState } from "react";
import { ClipboardList, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/ChatPanel";
import { ChecklistCard } from "@/components/ChecklistCard";
import { ProgressBar } from "@/components/ProgressBar";
// import { getSessionId } from "@/lib/api";
import { DEMO_MODE, getSessionId } from "@/lib/api";
import type { ChatResponse, Language } from "@/lib/types";
import { ChecklistSkeleton } from "@/components/ChecklistSkeleton";

export default function Home() {
  const [language] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "checklist">("chat");
  const [latest, setLatest] = useState<ChatResponse | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [mobileProgress, setMobileProgress] = useState<{ completed: number; total: number } | null>(null);
  const [sessionId] = useState(() =>
    typeof window !== "undefined" ? getSessionId() : ""
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChecklistUpdate = (response: ChatResponse) => {
  setLatest(response);
  setChecklistLoading(false);
};

  const checklistPanel = latest ? (
    <ChecklistCard
    checklist={latest.checklist}
    sources={latest.sources}
    onProgressChange={(completed, total) => setMobileProgress({ completed, total })}
  />
  ) : (
    <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">
        Describe what you need to do — for example, &ldquo;I want to open a
        small shop in Chandigarh&rdquo; — and I&apos;ll build your step-by-step
        checklist.
      </p>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <h1 className="text-lg font-bold text-primary">NagarSetu</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:block">
            One app. Every civic need.
          </span>
          {mounted && DEMO_MODE && (
            <span className="rounded-full bg-warning/15 px-3 py-1 text-[10px] font-semibold tracking-wide text-amber-700">
              DEMO MODE
            </span>
          )}
        </div>
      </header>

      {/* Desktop: two-column split (§10.1: 60% chat / 40% checklist, sticky) */}
      <div className="hidden flex-1 overflow-hidden lg:grid lg:grid-cols-[60%_40%]">
        <div className="h-full overflow-hidden border-r">
          <ChatPanel
            sessionId={sessionId}
            language={language}
            onChecklistUpdate={handleChecklistUpdate}
          />
        </div>
        <div className="h-full overflow-y-auto p-4">
          <div className="sticky top-0">{checklistPanel}</div>
        </div>
      </div>

      {/* Mobile: tabbed (§10.1) */}
      {/* Mobile: tabbed (§10.1) — single ChatPanel instance, CSS-toggled so state survives */}
      <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as "chat" | "checklist")}>
          <TabsList className="mx-4 mt-2 grid w-auto grid-cols-2">
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5">
              <ClipboardList className="h-4 w-4" /> Checklist
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Chat — always mounted, hidden when checklist tab active */}
        <div className={mobileTab === "chat" ? "flex-1 overflow-hidden" : "hidden"}>
          <ChatPanel
            sessionId={sessionId}
            language={language}
            onChecklistUpdate={handleChecklistUpdate}
          />
        </div>

        {/* Checklist panel */}
        <div className={mobileTab === "checklist" ? "flex-1 overflow-y-auto p-4" : "hidden"}>
          {checklistPanel}
        </div>

        {/* Bottom bar: X/Y steps complete (§10.1) */}
        {latest && (
          <div className="border-t bg-card px-4 py-2">
            <ProgressBar
              completed={mobileProgress?.completed ?? 0}
              total={latest.checklist.steps.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}