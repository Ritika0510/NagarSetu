/**
 * NagarSetu — API client per AGENTS.md §7, with Demo Mode per §11.
 *
 * Demo Mode triggers:
 *   1. ?demo=true URL param (§11)
 *   2. Any /api/chat failure → fall back to /public/demo/{procedure_id}.json
 * Behavior: 1.2s simulated typing delay, "Demo Mode" badge (§11).
 */

// Task 4: demo cache bundled via static imports — zero-network by
// construction. Works when venue Wi-Fi is dead; no fetch, no timeout.
import tradeLicense from "@/lib/demo/chandigarh_trade_license.json";
import waterConnection from "@/lib/demo/water_connection.json";
import propertyTax from "@/lib/demo/property_tax.json";

// import type {
//   ChatRequest,
//   ChatResponse,
//   Checklist,
//   ProgressResponse,
//   ProgressUpdate,
//   SourceRef,
// } from "./types";

import type {
  ChatRequest,
  ChatResponse,
  ChatResult,
  Checklist,
  OfflineChatResult,
  ProgressResponse,
  ProgressUpdate,
  SourceRef,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof window !== "undefined"
      ? ""
      : "http://localhost:8000";
const DEMO_DELAY_MS = 1200; // §11: simulate 1.2s typing delay

export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "true");

export function getSessionId(): string {
  if (typeof window === "undefined") return "server-side";
  let id = window.localStorage.getItem("nagarsetu_session_id");
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem("nagarsetu_session_id", id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// Demo Mode (§11)
// ---------------------------------------------------------------------------

const DEMO_PROCEDURES: { keywords: string[]; procedureId: string; label: string }[] = [
  { keywords: ["shop", "trade", "license", "licence", "business", "establishment"], procedureId: "chandigarh_trade_license", label: "trade license" },
  { keywords: ["water"], procedureId: "water_connection", label: "water connection" },
  { keywords: ["property tax", "house tax"], procedureId: "property_tax", label: "property tax" },
];

function detectDemoProcedure(message: string): string | null {
  const m = message.toLowerCase();
  for (const p of DEMO_PROCEDURES) {
    if (p.keywords.some((kw) => m.includes(kw))) return p.procedureId;
  }
  return null; // Task 4: no fallback — unmatched queries get offline error card
}
const DEMO_CACHE: Record<string, Checklist> = {
  chandigarh_trade_license: tradeLicense,
  water_connection: waterConnection,
  property_tax: propertyTax,
};

function loadDemoResponse(message: string): ChatResponse {
  const procedureId = detectDemoProcedure(message);

  if (!procedureId) {
    throw new Error("not cached: no matching procedure");
  }

  const checklist = DEMO_CACHE[procedureId];

  if (!checklist) {
    throw new Error(`not cached: ${procedureId}`);
  }

  const sources: SourceRef[] = [];
  for (const step of checklist.steps) {
    for (const cid of step.source_chunk_ids) {
      sources.push({
        chunk_id: cid,
        source_url: "MOCK",
        snippet: `Source for "${step.title}" (cached demo response).`,
      });
    }
  }

  return {
    assistant_message: `Here's the complete process for ${checklist.procedure_name.toLowerCase()}.`,
    checklist,
    sources,
    low_confidence: checklist.confidence < 0.6,
    demo_mode: true,
  };
}

/** §11: 1.2s typing delay wrapper around the zero-network cache. */
async function loadDemoResponseWithDelay(message: string): Promise<ChatResponse> {
  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));
  return loadDemoResponse(message);
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

const CHAT_TIMEOUT_MS = 15000; // Task 4: 15s AbortController timeout
const RETRY_DELAY_MS = 1000;   // Task 4: single silent retry

async function fetchChatWithTimeout(req: ChatRequest): Promise<ChatResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = `Chat request failed (${res.status})`;
      try {
        const body = (await res.json()) as { detail?: string };
        if (body.detail) detail = body.detail;
      } catch {
        // non-JSON error body — keep default message
      }
      throw new Error(detail);
    }
    return (await res.json()) as ChatResponse;
  } finally {
    clearTimeout(timer);
  }
}

function offlineError(): OfflineChatResult {
  return {
    error: true,
    reason: "offline_and_uncached",
    message:
      "We're offline — cached demo responses are available. Try the golden path demo or reconnect for live queries.",
    suggestions: [
      "How do I get a trade license in Chandigarh?",
      "How do I apply for a new water connection?",
      "How do I pay my property tax?",
    ],
  };
}

export async function sendChat(req: ChatRequest): Promise<ChatResult> {
  // §11 trigger 1: explicit demo param — zero-network, instant
  if (DEMO_MODE) {
    return loadDemoResponseWithDelay(req.message);
  }

  // Task 4: attempt → 1s delay → single silent retry
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetchChatWithTimeout(req);
    } catch (err) {
      lastError = err;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  // Both attempts failed → bundled demo-cache fallback per §11.
  console.warn("API chat failed (2 attempts), falling back to demo cache:", lastError);
  try {
    const demo = loadDemoResponse(req.message);
    return { ...demo, _offline_fallback: true };
  } catch {
    return offlineError();
  }
}

export async function updateProgress(
  update: ProgressUpdate
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/api/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(`Progress update failed (${res.status})`);
  return (await res.json()) as { ok: boolean };
}

export async function fetchProgress(
  sessionId: string,
  procedureId: string
): Promise<ProgressResponse> {
  const params = new URLSearchParams({
    session_id: sessionId,
    procedure_id: procedureId,
  });
  const res = await fetch(`${API_URL}/api/progress?${params.toString()}`);
  if (!res.ok) throw new Error(`Progress fetch failed (${res.status})`);
  return (await res.json()) as ProgressResponse;
}