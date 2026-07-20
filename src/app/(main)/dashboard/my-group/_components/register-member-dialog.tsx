"use client";

// Reusable "register member" dialog.
// - Leader mode: no group picker; member joins the leader's own group.
// - Admin mode: a group is fixed by the caller (the group being viewed).
// Either way the parent passes an onSubmit that performs the right call.

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import type { RegisterMemberInput } from "@/lib/api/users";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RegisterMemberInput) => Promise<void>;
  onSaved: () => void;
  contextLabel?: string; // e.g. group name, shown in the description
}

const PHONE_RE = /^\d{12}$/;

export function RegisterMemberDialog({ open, onOpenChange, onSubmit, onSaved, contextLabel }: Props) {
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setPhone("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      setErrors({});
    }
  }, [open]);

  function clientValidate(): boolean {
    const e: Record<string, string[]> = {};
    if (!PHONE_RE.test(phone)) {
      e.phone_number = ["Use format 256XXXXXXXXX — 12 digits, no spaces."];
    }
    if (password !== passwordConfirm) {
      e.password_confirm = ["Passwords do not match."];
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!clientValidate()) return;
    setSaving(true);
    try {
      await onSubmit({
        phone_number: phone,
        first_name: firstName,
        last_name: lastName,
        email: email.trim() || undefined,
        password,
        password_confirm: passwordConfirm,
      });
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

  const canSubmit =
    PHONE_RE.test(phone) && firstName.trim() && lastName.trim() && password.length > 0 && passwordConfirm.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register member</DialogTitle>
          <DialogDescription>
            {contextLabel ? `Add a member to ${contextLabel}. ` : ""}
            They log in with this phone number and the temporary password, then must set their own.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.first_name}>
              <FieldLabel htmlFor="m-first">Given name</FieldLabel>
              <Input
                id="m-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-invalid={!!errors.first_name}
              />
              {errors.first_name && <FieldError errors={errors.first_name.map((m) => ({ message: m }))} />}
            </Field>
            <Field data-invalid={!!errors.last_name}>
              <FieldLabel htmlFor="m-last">Surname</FieldLabel>
              <Input
                id="m-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-invalid={!!errors.last_name}
              />
              {errors.last_name && <FieldError errors={errors.last_name.map((m) => ({ message: m }))} />}
            </Field>
          </div>

          <Field data-invalid={!!errors.phone_number}>
            <FieldLabel htmlFor="m-phone">Phone number</FieldLabel>
            <Input
              id="m-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="256789123456"
              maxLength={12}
              aria-invalid={!!errors.phone_number}
            />
            {errors.phone_number && <FieldError errors={errors.phone_number.map((m) => ({ message: m }))} />}
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="m-email">Email (optional)</FieldLabel>
            <Input
              id="m-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && <FieldError errors={errors.email.map((m) => ({ message: m }))} />}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="m-pass">Temporary password</FieldLabel>
              <Input
                id="m-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
              />
              {errors.password && <FieldError errors={errors.password.map((m) => ({ message: m }))} />}
            </Field>
            <Field data-invalid={!!errors.password_confirm}>
              <FieldLabel htmlFor="m-pass2">Confirm password</FieldLabel>
              <Input
                id="m-pass2"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                aria-invalid={!!errors.password_confirm}
              />
              {errors.password_confirm && <FieldError errors={errors.password_confirm.map((m) => ({ message: m }))} />}
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !canSubmit}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Register member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
