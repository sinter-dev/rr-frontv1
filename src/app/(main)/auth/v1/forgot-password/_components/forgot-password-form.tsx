"use client";

// Forgot password: the user enters the EMAIL on their profile. If it's
// registered, a temporary password is emailed and they log in with it
// (they'll be forced to set a new one immediately). If not registered,
// we say so plainly.

import { useState } from "react";

import Link from "next/link";

import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError, apiFetch } from "@/lib/api/client";

type Phase = "form" | "sent";

export function ForgotPasswordForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch<{ detail: string }>("/api/auth/forgot-password/", {
        method: "POST",
        body: { email: trimmed },
        auth: false,
      });
      setPhase("sent");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Something went wrong. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "sent") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="size-7 text-primary" />
        </div>
        <div>
          <h2 className="font-medium text-xl tracking-tight">Check your email</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            We've sent a temporary password to <strong>{email.trim()}</strong>. Log in with your phone number and that
            password — you'll be asked to set a new password right away.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/auth/v1/login">Back to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h2 className="font-medium text-xl tracking-tight">Forgot your password?</h2>
        <p className="text-muted-foreground text-sm">
          Enter the email address on your profile and we'll send you a temporary password.
        </p>
      </div>

      <Field className="gap-1.5" data-invalid={!!error}>
        <FieldLabel htmlFor="fp-email">Email address</FieldLabel>
        <Input
          id="fp-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSubmit();
          }}
          aria-invalid={!!error}
        />
        {error && <FieldError errors={[{ message: error }]} />}
      </Field>

      <Button className="w-full" onClick={() => void handleSubmit()} disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send temporary password"
        )}
      </Button>

      <Link
        href="/auth/v1/login"
        className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm underline-offset-2 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to login
      </Link>
    </div>
  );
}
