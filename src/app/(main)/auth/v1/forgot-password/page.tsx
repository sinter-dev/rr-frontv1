import Image from "next/image";

import { APP_CONFIG } from "@/config/app-config";

import { ForgotPasswordForm } from "./_components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm space-y-8">
        <Image
          src="/logo.png"
          alt={`${APP_CONFIG.name} logo`}
          width={48}
          height={48}
          className="mx-auto rounded-lg"
          priority
        />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
