/**
 * NagarSetu — shared types mirroring AGENTS.md §6.2 / §7.
 * No `any` anywhere (§14.1).
 */

// §6.2 — LLM output contract
export interface ChecklistStep {
  step_number: number;
  title: string;
  description: string;
  documents_needed: string[];
  fee: string;
  processing_time: string;
  official_link: string;
  source_chunk_ids: string[];
  verified: boolean;
}

export interface Checklist {
  procedure_name: string;
  procedure_id: string;
  summary: string;
  estimated_total_time: string;
  estimated_total_cost: string;
  confidence: number;
  steps: ChecklistStep[];
  warnings: string[];
}

// §7 — POST /api/chat response
export interface SourceRef {
  chunk_id: string;
  source_url: string;
  snippet: string;
}

export interface ChatResponse {
  assistant_message: string;
  checklist: Checklist;
  sources: SourceRef[];
  low_confidence: boolean;
  refusal?: boolean;
  reason?: string;
  message?: string;
  suggestions?: string[];
}

// §7 — POST /api/chat request
export type Language = "en" | "hi";

export interface ChatRequest {
  session_id: string;
  message: string;
  language: Language;
}

// §7 — progress
export interface ProgressUpdate {
  session_id: string;
  procedure_id: string;
  step_number: number;
  completed: boolean;
}

export interface ProgressResponse {
  completed_steps: number[];
  total_steps: number;
}

// Chat UI state
export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  /** Present only on assistant messages that produced a checklist */
  checklist?: Checklist;
  sources?: SourceRef[];
  lowConfidence?: boolean;
  demoMode?: boolean;
  refusal?: {
    message: string;
    suggestions: string[];
  };
    /** Task 4: offline-fallback payload — card rendered instead of checklist */
  offline?: {
    message: string;
    suggestions: string[];
  };
  /** Task 4: true when this checklist came from the demo cache due to
   * network failure — renders "Cached response (offline)" marker */
  cachedOffline?: boolean;
}

export interface ChatResponse {
  assistant_message: string;
  checklist: Checklist;
  sources: SourceRef[];
  low_confidence: boolean;
  /** Set when this response was served from the demo cache (§11) */
  demo_mode?: boolean;
}

/** Task 4: sendChat may return a structured error instead of throwing */
export interface OfflineChatResult {
  error: true;
  reason: "offline_and_uncached";
  message: string;
  suggestions: string[];
}

export type ChatResult =
  | ChatResponse
  | OfflineChatResult
  | (ChatResponse & { _offline_fallback?: boolean });