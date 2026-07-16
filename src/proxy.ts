// src/proxy.ts
// The repo ships this as proxy.disabled.ts — this is the enabled,
// filled-in version. It runs before every request:
//  - /dashboard/* without a token  -> redirect to login
//  - /auth/*/login with a token    -> redirect to dashboard
//
// Note: this checks token PRESENCE, which is right for routing UX.
// Real security stays on the backend — every API call is verified
// by Django, so a forged cookie only shows an empty dashboard shell.

import { type NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/auth/v1/login";
const DASHBOARD_PATH = "/dashboard/default";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const { pathname } = req.nextUrl;

  const isDashboard = pathname.startsWith("/dashboard");
  const isLoginPage = /^\/auth\/v\d+\/login/.test(pathname);

  if (isDashboard && !token) {
    const loginUrl = new URL(LOGIN_PATH, req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip static assets and Next internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
