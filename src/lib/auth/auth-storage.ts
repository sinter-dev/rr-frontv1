// src/lib/auth/auth-storage.ts
// Where the session lives:
// - access/refresh tokens -> cookies, so src/proxy.ts can read them
//   server-side and protect /dashboard routes.
// - user profile -> localStorage, for instant client-side access (name,
//   role, must_change_password) without decoding the JWT.

import { deleteClientCookie, getClientCookie, setClientCookie } from "@/lib/cookie.client";

import type { AuthUser, LoginResponse } from "./auth-api";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
const USER_STORAGE_KEY = "auth_user";

export function saveSession(data: LoginResponse) {
  // Cookie lifetimes mirror the backend SIMPLE_JWT settings
  setClientCookie(ACCESS_TOKEN_COOKIE, data.access, 1); // access: short-lived
  setClientCookie(REFRESH_TOKEN_COOKIE, data.refresh, 7); // refresh: 7 days
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
}

export function getAccessToken(): string | undefined {
  return getClientCookie(ACCESS_TOKEN_COOKIE);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Merge partial changes into the stored profile — e.g. after the user
 * changes their password we flip must_change_password to false locally,
 * so the app stops redirecting them to the change-password screen.
 */
export function updateStoredUser(changes: Partial<AuthUser>) {
  const current = getStoredUser();
  if (!current) return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ ...current, ...changes }));
}

export function clearSession() {
  deleteClientCookie(ACCESS_TOKEN_COOKIE);
  deleteClientCookie(REFRESH_TOKEN_COOKIE);
  localStorage.removeItem(USER_STORAGE_KEY);
}
