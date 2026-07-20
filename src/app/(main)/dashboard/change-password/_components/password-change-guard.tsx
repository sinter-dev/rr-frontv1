"use client";

// Forces users with must_change_password=true onto the change-password
// screen. Rendered once in the dashboard layout so it covers every
// dashboard route. It's a client-side guard for UX; the real protection
// is that the temporary password is only known to whoever created it.

import { useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { getStoredUser } from "@/lib/auth/auth-storage";

const CHANGE_PASSWORD_PATH = "/dashboard/change-password";

export function PasswordChangeGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === CHANGE_PASSWORD_PATH) return;
    const user = getStoredUser();
    if (user?.must_change_password) {
      router.replace(CHANGE_PASSWORD_PATH);
    }
  }, [pathname, router]);

  return null;
}
