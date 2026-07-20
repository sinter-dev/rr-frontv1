"use client";

// Change password screen.
// Two modes, decided by the user's must_change_password flag:
//  - FORCED (first login): explains why, no "back to dashboard" escape.
//  - VOLUNTARY: normal change, with a cancel link.

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { getStoredUser, updateStoredUser } from "@/lib/auth/auth-storage";

export function ChangePasswordView() {
  const router = useRouter();
  const [forced, setForced] = useState(false);
  const [ready, setReady] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const user = getStoredUser();
    setForced(user?.must_change_password ?? false);
    setReady(true);
  }, []);

  function clientValidate(): boolean {
    const e: Record<string, string[]> = {};
    if (newPassword !== confirm) {
      e.new_password_confirm = ["Passwords do not match."];
    }
    if (newPassword && newPassword === oldPassword) {
      e.new_password = ["New password must be different from the old one."];
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!clientValidate()) return;
    setSaving(true);
    try {
      const res = await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirm,
      });
      // reflect the change locally so we stop forcing the redirect
      updateStoredUser({ must_change_password: false });
      toast.success(res.message);
      router.replace("/dashboard/default");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          setErrors(error.fieldErrors);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = oldPassword.length > 0 && newPassword.length > 0 && confirm.length > 0;

  if (!ready) return null;

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="size-5 text-primary" />
          </div>
          <CardTitle>{forced ? "Set your own password" : "Change password"}</CardTitle>
          <CardDescription>
            {forced
              ? "You’re signed in with a temporary password created by your administrator. Choose your own password to continue."
              : "Update the password you use to sign in."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Field data-invalid={!!errors.old_password}>
              <FieldLabel htmlFor="cp-old">{forced ? "Temporary password" : "Current password"}</FieldLabel>
              <Input
                id="cp-old"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                aria-invalid={!!errors.old_password}
              />
              {errors.old_password && <FieldError errors={errors.old_password.map((m) => ({ message: m }))} />}
            </Field>

            <Field data-invalid={!!errors.new_password}>
              <FieldLabel htmlFor="cp-new">New password</FieldLabel>
              <Input
                id="cp-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!errors.new_password}
              />
              {errors.new_password && <FieldError errors={errors.new_password.map((m) => ({ message: m }))} />}
            </Field>

            <Field data-invalid={!!errors.new_password_confirm}>
              <FieldLabel htmlFor="cp-confirm">Confirm new password</FieldLabel>
              <Input
                id="cp-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!errors.new_password_confirm}
              />
              {errors.new_password_confirm && (
                <FieldError errors={errors.new_password_confirm.map((m) => ({ message: m }))} />
              )}
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              {!forced && (
                <Button variant="outline" onClick={() => router.back()} disabled={saving}>
                  Cancel
                </Button>
              )}
              <Button onClick={() => void handleSubmit()} disabled={saving || !canSubmit}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
