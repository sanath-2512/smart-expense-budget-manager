import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "auth_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  setAuthTokenGetter(() => token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  setAuthTokenGetter(null);
}

if (typeof window !== "undefined") {
  const existing = getAuthToken();
  if (existing) {
    setAuthTokenGetter(() => existing);
  }
}
