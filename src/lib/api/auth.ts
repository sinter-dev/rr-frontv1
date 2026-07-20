// src/lib/api/auth.ts
// Password change for the logged-in user.

import { apiFetch } from "./client";

export interface ChangePasswordInput {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export function changePassword(data: ChangePasswordInput) {
  return apiFetch<{ message: string }>("/api/auth/change-password/", {
    method: "POST",
    body: data,
  });
}
