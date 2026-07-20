// src/lib/api/dashboard.ts
// Role-aware dashboard summary. One request; the `scope` field tells us
// which shape came back (discriminated union).

import { apiFetch } from "./client";
import type { AppUser } from "./users";

export interface SuperAdminStats {
  scope: "super_admin";
  counts: {
    countries: number;
    parks: number;
    communities: number;
    roles: number;
    groups: number;
    leaders: number;
    members: number;
    groups_without_leader: number;
    pending_password: number;
  };
  members_by_role: { role: string; count: number }[];
  recent_members: AppUser[];
}

export interface GroupContext {
  id: number;
  name: string;
  role: string;
  community: string;
  park: string;
}

export interface LeaderStats {
  scope: "leader";
  group: GroupContext;
  counts: { members: number; pending_password: number };
  recent_members: AppUser[];
}

export interface MemberStats {
  scope: "member";
  group: GroupContext;
  counts: { members: number; pending_password: number };
}

export interface NoScopeStats {
  scope: "none";
  counts: Record<string, never>;
}

export type DashboardStats = SuperAdminStats | LeaderStats | MemberStats | NoScopeStats;

export function getDashboardStats() {
  return apiFetch<DashboardStats>("/api/dashboard/stats/");
}
