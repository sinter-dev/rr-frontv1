// src/lib/api/accounts.ts
// Typed wrappers for roles and groups (from the accounts app).

import { apiFetch } from "./client";

// ----------------------------------------------------------- Roles
// The roles endpoint is keyed by `code` (backend lookup_field = "code").

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface RoleInput {
  name: string;
  description?: string;
  is_active?: boolean;
}

export function listRoles() {
  return apiFetch<Role[]>("/api/roles/");
}

export function createRole(data: RoleInput) {
  return apiFetch<Role>("/api/roles/", { method: "POST", body: data });
}

export function updateRole(code: string, data: Partial<RoleInput>) {
  return apiFetch<Role>(`/api/roles/${code}/`, { method: "PATCH", body: data });
}

export function deactivateRole(code: string) {
  return apiFetch<{ message: string }>(`/api/roles/${code}/`, { method: "DELETE" });
}

// ----------------------------------------------------------- Groups

export interface Group {
  id: number;
  name: string;
  community: number;
  community_name: string;
  role: number;
  role_name: string;
  leader: number | null;
  leader_phone: string | null;
  leader_name: string | null;
  is_active: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupInput {
  name: string;
  community: number;
  role: number;
  is_active?: boolean;
}

export function listGroups(params?: { community?: number; role?: string }) {
  const q = new URLSearchParams();
  if (params?.community) q.set("community", String(params.community));
  if (params?.role) q.set("role", params.role);
  const qs = q.toString();
  return apiFetch<Group[]>(`/api/groups/${qs ? `?${qs}` : ""}`);
}

export function createGroup(data: GroupInput) {
  return apiFetch<Group>("/api/groups/", { method: "POST", body: data });
}

export function updateGroup(id: number, data: Partial<GroupInput>) {
  return apiFetch<Group>(`/api/groups/${id}/`, { method: "PATCH", body: data });
}

export function deactivateGroup(id: number) {
  return apiFetch<{ message: string }>(`/api/groups/${id}/`, { method: "DELETE" });
}
