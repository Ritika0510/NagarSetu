export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://nagarsetu-jco2.onrender.com";

export interface AccountDetails {
  id: string;
  full_name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  created_at: string;
}

export interface RegistrationDetails {
  full_name: string;
  email: string;
  password: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
}

interface AuthResponse {
  user: AccountDetails;
}

export type SignInResult =
  | { requiresTwoFactor: true; challengeId: string }
  | { requiresTwoFactor: false; user: AccountDetails };

export interface TwoFactorSetup {
  secret: string;
  otpauth_uri: string;
}

export interface AccountPreferences {
  language: "en" | "hi";
  email_alerts: boolean;
  push_notifications: boolean;
  digest_frequency: "immediate" | "daily" | "weekly" | "never";
  do_not_disturb: boolean;
}

export interface AccountSession {
  id: string;
  created_at: string;
  expires_at: string;
  remote_address: string;
  user_agent: string;
  is_current: boolean;
}

export interface LoginEvent {
  logged_in_at: string;
  remote_address: string;
  user_agent: string;
}

async function authRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}/api/auth${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}). Please try again.`;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      // Keep the HTTP error message when the response is not JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function sendAuthRequest(
  endpoint: "register" | "login",
  details: RegistrationDetails | Pick<RegistrationDetails, "email" | "password">
): Promise<AccountDetails> {
  const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(details),
  });

  if (!response.ok) {
    const body = (await response.json()) as { detail?: unknown };
    const message =
      typeof body.detail === "string"
        ? body.detail
        : response.status === 422
          ? "Check the information in the form and try again."
          : `Request failed (${response.status}). Please try again.`;
    throw new Error(message);
  }

  const body = (await response.json()) as AuthResponse;
  return body.user;
}

export function registerAccount(
  details: RegistrationDetails
): Promise<AccountDetails> {
  return sendAuthRequest("register", details);
}

export function signIn(
  email: string,
  password: string
): Promise<SignInResult> {
  return fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  }).then(async (response) => {
    if (!response.ok) {
      let message = `Request failed (${response.status}). Please try again.`;
      try {
        const body = (await response.json()) as { detail?: unknown };
        if (typeof body.detail === "string") message = body.detail;
      } catch {
        // Keep the HTTP error message when the response is not JSON.
      }
      throw new Error(message);
    }

    const body = (await response.json()) as {
      user?: AccountDetails;
      requires_two_factor?: boolean;
      challenge_id?: string;
    };
    if (body.requires_two_factor && body.challenge_id) {
      return { requiresTwoFactor: true, challengeId: body.challenge_id };
    }
    if (body.user) return { requiresTwoFactor: false, user: body.user };
    throw new Error("The sign-in response was incomplete. Please try again.");
  });
}

export async function completeTwoFactorSignIn(
  challengeId: string,
  code: string
): Promise<AccountDetails> {
  const response = await authRequest<AuthResponse>("/login/two-factor", {
    method: "POST",
    body: JSON.stringify({ challenge_id: challengeId, code }),
  });
  return response.user;
}

export function getTwoFactorStatus(): Promise<{ enabled: boolean }> {
  return authRequest("/two-factor");
}

export function beginTwoFactorSetup(): Promise<TwoFactorSetup> {
  return authRequest("/two-factor/setup", { method: "POST" });
}

export function enableTwoFactor(code: string): Promise<{ enabled: boolean }> {
  return authRequest("/two-factor/enable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function disableTwoFactor(
  password: string,
  code: string
): Promise<{ enabled: boolean }> {
  return authRequest("/two-factor/disable", {
    method: "POST",
    body: JSON.stringify({ password, code }),
  });
}

export async function getCurrentAccount(): Promise<AccountDetails> {
  const response = await authRequest<AuthResponse>("/me");
  return response.user;
}

export async function updateAccountProfile(
  details: Omit<AccountDetails, "id" | "email" | "created_at">
): Promise<AccountDetails> {
  const response = await authRequest<AuthResponse>("/me", {
    method: "PATCH",
    body: JSON.stringify(details),
  });
  return response.user;
}

export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await authRequest<{ ok: boolean }>("/password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export async function getAccountPreferences(): Promise<AccountPreferences> {
  return authRequest<AccountPreferences>("/preferences");
}

export async function saveAccountPreferences(
  preferences: AccountPreferences
): Promise<AccountPreferences> {
  return authRequest<AccountPreferences>("/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}

export async function getAccountSessions(): Promise<AccountSession[]> {
  const response = await authRequest<{ sessions: AccountSession[] }>("/sessions");
  return response.sessions;
}

export async function revokeAccountSession(sessionId: string): Promise<void> {
  await authRequest<{ ok: boolean }>(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

export async function getLoginHistory(): Promise<LoginEvent[]> {
  const response = await authRequest<{ history: LoginEvent[] }>("/login-history");
  return response.history;
}

export async function signOut(): Promise<void> {
  await authRequest<{ ok: boolean }>("/logout", {
    method: "POST",
  });
}

