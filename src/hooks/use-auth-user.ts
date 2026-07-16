"use client";

// src/hooks/use-auth-user.ts
// Client hooks for reading the logged-in user and logging out.
// The user is read from localStorage AFTER mount (useEffect) to avoid
// SSR/hydration mismatches — on the server there is no localStorage.

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import type { AuthUser } from "@/lib/auth/auth-api";
import { clearSession, getStoredUser } from "@/lib/auth/auth-storage";

export function useAuthUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return user;
}

export function useLogout() {
  const router = useRouter();

  return function logout() {
    clearSession();
    toast.success("Logged out. See you soon!");
    // replace (not push): the dashboard should not be reachable via Back
    router.replace("/auth/v1/login");
  };
}

// Small display helpers shared by the sidebar components
export function displayName(user: AuthUser): string {
  const full = `${user.first_name} ${user.last_name}`.trim();
  return full || user.phone_number;
}

export function displayRole(user: AuthUser): string {
  if (!user.role) return "No role";
  return user.is_group_leader ? `${user.role.name} — Leader` : user.role.name;
}
