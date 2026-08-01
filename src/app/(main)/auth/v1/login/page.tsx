// src/app/(main)/auth/v1/login/page.tsx
// The left side is now the PUBLIC "Pay a worker" experience — most
// visitors are payers, not staff, so it takes the prominent position.
// Staff sign in on the right.

import Image from "next/image";

import { APP_CONFIG } from "@/config/app-config";

import { LoginForm } from "../../_components/login-form";
import { PayWorkerPanel } from "../../_components/pay-worker-panel";

export default function LoginV1() {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* LEFT — public payment */}
      <div className="flex flex-1 flex-col justify-center bg-primary p-8 lg:p-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            {/* <Image
              src="/logo.png"
              alt={`${APP_CONFIG.name} logo`}
              width={64}
              height={64}
              className="rounded-lg"
              priority
            /> */}
            <span className="font-medium text-lg text-primary-foreground">{APP_CONFIG.name}</span>
          </div>
          <PayWorkerPanel />
        </div>
      </div>

      {/* RIGHT — staff login */}
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-[420px] lg:shrink-0">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center">
            <Image
              src="/logo.png"
              alt={`${APP_CONFIG.name} logo`}
              width={64}
              height={64}
              className="mx-auto rounded-lg"
            />
            <h1 className="font-medium text-xl tracking-tight">Staff sign in</h1>
            <p className="text-muted-foreground text-sm">
              Enter your phone number and password to access your account.
            </p>
          </div>
          <LoginForm />
          <p className="text-center text-muted-foreground text-xs">
            Accounts are created by your group leader or administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
