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
  // Exactly one of group / role must be set — matches the backend's
  // validation. group = add to an existing group (unchanged). role =
  // create a GROUPLESS user with that role directly (freelancers, or
  // staff like Super Admin / Junior Admin / Warden / Tour Operator).
  group?: number;
  role?: number;
  community?: number; // optional, only meaningful alongside `role`
}

export function adminRegisterMember(data: AdminRegisterMemberInput) {
  return apiFetch<RegisterResponse>("/api/auth/admin-register-member/", {
    method: "POST",
    body: data,
  });
}

// ------------------------------------------------- All users (super admin)

export interface ListUsersParams {
  search?: string;
  group?: number;
  community?: number;
  role?: string; // role CODE, not id — matches the backend filter
  groupless?: boolean;
}

export function listAllUsers(params?: ListUsersParams) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.group) q.set("group", String(params.group));
  if (params?.community) q.set("community", String(params.community));
  if (params?.role) q.set("role", params.role);
  if (params?.groupless) q.set("groupless", "true");
  const qs = q.toString();
  return apiFetch<AppUser[]>(`/api/users/${qs ? `?${qs}` : ""}`);
}

// ------------------------------------------------- Leadership

export function setGroupLeader(groupId: number, memberId: number) {
  return apiFetch<{ message: string }>(`/api/groups/${groupId}/set-leader/`, {
    method: "POST",
    body: { member: memberId },
  });
}
