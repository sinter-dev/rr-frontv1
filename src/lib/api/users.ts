// src/lib/api/users.ts
// Typed wrappers for user listing, registration, and leadership.

import { apiFetch } from "./client";

export interface UserRole {
  code: string;
  name: string;
}

export interface UserCommunity {
  id: number;
  name: string;
}

export interface AppUser {
  id: number;
  phone_number: string;
  email: string | null;
  first_name: string;
  last_name: string;
  group: number | null;
  group_name: string | null;
  role: UserRole | null;
  community: UserCommunity | null;
  is_group_leader: boolean;
  must_change_password: boolean;
  registered_by: number | null;
  created_at: string;
}

export interface RegisterResponse {
  message: string;
  user: AppUser;
}

// ------------------------------------------------- Leaders (super admin)

export function listLeaders(params?: { community?: number; role?: string }) {
  const q = new URLSearchParams();
  if (params?.community) q.set("community", String(params.community));
  if (params?.role) q.set("role", params.role);
  const qs = q.toString();
  return apiFetch<AppUser[]>(`/api/leaders/${qs ? `?${qs}` : ""}`);
}

export interface RegisterLeaderInput {
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  group: number;
  password: string;
  password_confirm: string;
}

export function registerLeader(data: RegisterLeaderInput) {
  return apiFetch<RegisterResponse>("/api/auth/register-leader/", { method: "POST", body: data });
}

// ------------------------------------------------- Members (group leader)

export function listMyMembers() {
  return apiFetch<AppUser[]>("/api/auth/my-members/");
}

export interface RegisterMemberInput {
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  password: string;
  password_confirm: string;
}

export function registerMember(data: RegisterMemberInput) {
  return apiFetch<RegisterResponse>("/api/auth/register-member/", { method: "POST", body: data });
}

// ------------------------------------------------- Members (super admin)

export function listGroupMembers(groupId: number) {
  return apiFetch<AppUser[]>(`/api/groups/${groupId}/members/`);
}

export interface AdminRegisterMemberInput extends RegisterMemberInput {
  group: number;
}

export function adminRegisterMember(data: AdminRegisterMemberInput) {
  return apiFetch<RegisterResponse>("/api/auth/admin-register-member/", {
    method: "POST",
    body: data,
  });
}

// ------------------------------------------------- Leadership

export function setGroupLeader(groupId: number, memberId: number) {
  return apiFetch<{ message: string }>(`/api/groups/${groupId}/set-leader/`, {
    method: "POST",
    body: { member: memberId },
  });
}
