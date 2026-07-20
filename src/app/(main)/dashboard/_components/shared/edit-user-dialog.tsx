"use client";

// Edit a user's details. Two modes:
//   mode="leader" -> name + email only (leader fixing a member's record)
//   mode="admin"  -> also the phone number (super admin only)
// Includes an optional "reset password" section that sets a new temporary
// password and forces a change at next login.

import { useEffect, useState } from "react";

import { KeyRound, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ApiError } from "@/lib/api/client";
import { adminResetPassword, adminUpdateUser, leaderResetMemberPassword, leaderUpdateMember } from "@/lib/api/profile";
import type { AppUser } from "@/lib/api/users";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
  mode: "leader" | "admin";
  onSaved: () => void;
}

const PHONE_RE = /^\d{12}$/;

export function EditUserDialog({ open, onOpenChange, user, mode, onSaved }: Props) {
  const isAdmin = mode === "admin";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // password reset section
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setEmail(user.email ?? "");
      setPhone(user.phone_number);
      setErrors({});
      setShowReset(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open, user]);

  async function handleSave() {
    if (!user) return;
    if (isAdmin && !PHONE_RE.test(phone)) {
      setErrors({ phone_number: ["Use format 256XXXXXXXXX — 12 digits."] });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const base = {
        first_name: firstName,
        last_name: lastName,
        email: email.trim() || null,
      };
      const res = isAdmin
        ? await adminUpdateUser(user.id, { ...base, phone_number: phone })
        : await leaderUpdateMember(user.id, base);
      toast.success(res.message);
      onSaved();
      onOpenChange(false);
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

  async function handleReset() {
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setErrors({ new_password_confirm: ["Passwords do not match."] });
      return;
    }
    setResetting(true);
    setErrors({});
    try {
      const payload = { new_password: newPassword, new_password_confirm: confirmPassword };
      const res = isAdmin
        ? await adminResetPassword(user.id, payload)
        : await leaderResetMemberPassword(user.id, payload);
      toast.success(res.message);
      setShowReset(false);
      setNewPassword("");
      setConfirmPassword("");
      onSaved();
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
      setResetting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {user?.first_name || "user"}</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Update this person's details. Changing the phone number changes how they sign in."
              : "Correct this member's name or email."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.first_name}>
              <FieldLabel htmlFor="e-first">Given name</FieldLabel>
              <Input
                id="e-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-invalid={!!errors.first_name}
              />
              {errors.first_name && <FieldError errors={errors.first_name.map((m) => ({ message: m }))} />}
            </Field>
            <Field data-invalid={!!errors.last_name}>
              <FieldLabel htmlFor="e-last">Surname</FieldLabel>
              <Input
                id="e-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-invalid={!!errors.last_name}
              />
              {errors.last_name && <FieldError errors={errors.last_name.map((m) => ({ message: m }))} />}
            </Field>
          </div>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="e-email">Email (optional)</FieldLabel>
            <Input
              id="e-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && <FieldError errors={errors.email.map((m) => ({ message: m }))} />}
          </Field>

          <Field data-invalid={!!errors.phone_number}>
            <FieldLabel htmlFor="e-phone">
              <span className="flex items-center gap-1.5">
                {!isAdmin && <Lock className="size-3.5" />}
                Phone number
              </span>
            </FieldLabel>
            <Input
              id="e-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={12}
              disabled={!isAdmin}
              readOnly={!isAdmin}
              aria-invalid={!!errors.phone_number}
            />
            <FieldDescription>
              {isAdmin
                ? "This is their login ID and the audit anchor for their wallet. Change it only to correct a genuine error."
                : "Only an administrator can change a phone number."}
            </FieldDescription>
            {errors.phone_number && <FieldError errors={errors.phone_number.map((m) => ({ message: m }))} />}
          </Field>

          <Separator />

          {!showReset ? (
            <Button variant="outline" size="sm" className="w-fit" onClick={() => setShowReset(true)}>
              <KeyRound className="size-4" />
              Reset password
            </Button>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border p-3">
              <p className="text-muted-foreground text-sm">
                Set a temporary password and share it with them. They must change it at next login.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field data-invalid={!!errors.new_password}>
                  <FieldLabel htmlFor="e-newpass">New password</FieldLabel>
                  <Input
                    id="e-newpass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    aria-invalid={!!errors.new_password}
                  />
                  {errors.new_password && <FieldError errors={errors.new_password.map((m) => ({ message: m }))} />}
                </Field>
                <Field data-invalid={!!errors.new_password_confirm}>
                  <FieldLabel htmlFor="e-newpass2">Confirm</FieldLabel>
                  <Input
                    id="e-newpass2"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-invalid={!!errors.new_password_confirm}
                  />
                  {errors.new_password_confirm && (
                    <FieldError errors={errors.new_password_confirm.map((m) => ({ message: m }))} />
                  )}
                </Field>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleReset()}
                  disabled={resetting || !newPassword || !confirmPassword}
                >
                  {resetting && <Loader2 className="size-4 animate-spin" />}
                  Set temporary password
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowReset(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Close
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
