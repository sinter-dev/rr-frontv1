// src/lib/api/profile.ts
// Profile editing (self), leader editing members, and super-admin user
// administration.
//
// PHONE NUMBER POLICY: phone_number is the login identifier and the audit
// anchor for wallets. Only the super admin can change it — the self and
// leader endpoints ignore it entirely, server-side.

import { apiFetch } from "./client";
import type { AppUser } from "./users";

export interface UserUpdateResponse {
  message: string;
  user: AppUser;
}

// ------------------------------------------------- Self

export interface SelfProfileInput {
  first_name: string;
  last_name: string;
  email?: string | null;
}

export function getMyProfile() {
  return apiFetch<AppUser>("/api/auth/profile/");
}

export function updateMyProfile(data: SelfProfileInput) {
  return apiFetch<UserUpdateResponse>("/api/auth/profile/", { method: "PATCH", body: data });
}

// ------------------------------------------------- Leader -> own members

export function leaderUpdateMember(userId: number, data: SelfProfileInput) {
  return apiFetch<UserUpdateResponse>(`/api/auth/my-members/${userId}/`, {
    method: "PATCH",
    body: data,
  });
}

export interface ResetPasswordInput {
  new_password: string;
  new_password_confirm: string;
}

export function leaderResetMemberPassword(userId: number, data: ResetPasswordInput) {
  return apiFetch<{ message: string }>(`/api/auth/my-members/${userId}/reset-password/`, {
    method: "POST",
    body: data,
  });
}

// ------------------------------------------------- Super admin -> anyone

export interface AdminUserInput extends SelfProfileInput {
  phone_number?: string; // super admin only
  group?: number | null;
  is_active?: boolean;
}

export function listAllUsers(params?: { group?: number; community?: number; role?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params?.group) q.set("group", String(params.group));
  if (params?.community) q.set("community", String(params.community));
  if (params?.role) q.set("role", params.role);
  if (params?.search) q.set("search", params.search);
  const qs = q.toString();
  return apiFetch<AppUser[]>(`/api/users/${qs ? `?${qs}` : ""}`);
}

export function adminUpdateUser(userId: number, data: AdminUserInput) {
  return apiFetch<UserUpdateResponse>(`/api/users/${userId}/`, { method: "PATCH", body: data });
}

export function adminResetPassword(userId: number, data: ResetPasswordInput) {
  return apiFetch<{ message: string }>(`/api/users/${userId}/reset-password/`, {
    method: "POST",
    body: data,
  });
}
