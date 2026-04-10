import { setAuthTokenGetter } from "@workspace/api-client-react";

export const AUTH_TOKEN_KEY = "auth_token";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// Initialize the API client with our token getter
setAuthTokenGetter(() => getAuthToken());
