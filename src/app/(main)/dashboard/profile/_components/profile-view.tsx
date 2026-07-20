"use client";

// "My Profile" — self-service editing of your own name and email.
// The phone number is shown but locked, with an explanation: it is the
// login identifier and audit anchor, changeable only by an administrator.

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { KeyRound, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { getMyProfile, updateMyProfile } from "@/lib/api/profile";
import type { AppUser } from "@/lib/api/users";
import { updateStoredUser } from "@/lib/auth/auth-storage";
import { getInitials } from "@/lib/utils";

export function ProfileView() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMyProfile();
      setUser(me);
      setFirstName(me.first_name);
      setLastName(me.last_name);
      setEmail(me.email ?? "");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setErrors({});
    try {
      const res = await updateMyProfile({
        first_name: firstName,
        last_name: lastName,
        email: email.trim() || null,
      });
      toast.success(res.message);
      setUser(res.user);
      // keep the sidebar/header in sync with the new name
      updateStoredUser({
        first_name: res.user.first_name,
        last_name: res.user.last_name,
        email: res.user.email,
      });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading profile...
      </div>
    );
  }

  if (!user) return null;

  const displayName = `${user.first_name} ${user.last_name}`.trim() || user.phone_number;
  const dirty = firstName !== user.first_name || lastName !== user.last_name || email !== (user.email ?? "");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <Avatar className="size-16 rounded-xl">
            <AvatarFallback className="rounded-xl text-lg">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-lg">{displayName}</p>
            <p className="truncate text-muted-foreground text-sm">{user.phone_number}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.role && <Badge variant="secondary">{user.role.name}</Badge>}
              {user.is_group_leader && <Badge>Group leader</Badge>}
              {user.group_name && <Badge variant="outline">{user.group_name}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>Update your name and email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field data-invalid={!!errors.first_name}>
                <FieldLabel htmlFor="p-first">Given name</FieldLabel>
                <Input
                  id="p-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-invalid={!!errors.first_name}
                />
                {errors.first_name && <FieldError errors={errors.first_name.map((m) => ({ message: m }))} />}
              </Field>
              <Field data-invalid={!!errors.last_name}>
                <FieldLabel htmlFor="p-last">Surname</FieldLabel>
                <Input
                  id="p-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  aria-invalid={!!errors.last_name}
                />
                {errors.last_name && <FieldError errors={errors.last_name.map((m) => ({ message: m }))} />}
              </Field>
            </div>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="p-email">Email (optional)</FieldLabel>
              <Input
                id="p-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <FieldError errors={errors.email.map((m) => ({ message: m }))} />}
            </Field>

            <Field>
              <FieldLabel htmlFor="p-phone">
                <span className="flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  Phone number
                </span>
              </FieldLabel>
              <Input id="p-phone" value={user.phone_number} disabled readOnly />
              <FieldDescription>
                Your phone number is your login ID and is used to trace your account and wallet. Only an administrator
                can change it.
              </FieldDescription>
            </Field>

            <div className="flex justify-end pt-2">
              <Button onClick={() => void handleSave()} disabled={saving || !dirty}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage how you sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/change-password">
              <KeyRound className="size-4" />
              Change password
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
