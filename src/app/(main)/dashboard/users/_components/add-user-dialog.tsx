"use client";

// "Add User" — super admin creates EITHER a member in an existing group,
// OR a groupless user with a role picked directly (freelancer, or staff
// like Super Admin / Junior Admin / Warden / Tour Operator).
// Field pattern mirrors RegisterMemberDialog exactly for consistency.

import { useCallback, useEffect, useState } from "react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Group, listGroups, listRoles, type Role } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { type Community, listCommunities } from "@/lib/api/geography";
import { adminRegisterMember } from "@/lib/api/users";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const PHONE_RE = /^\d{12}$/;

export function AddUserDialog({ open, onOpenChange, onSaved }: Props) {
  const [mode, setMode] = useState<"group" | "groupless">("groupless");

  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");
  const [communityId, setCommunityId] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const reset = useCallback(() => {
    setMode("groupless");
    setPhone("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setGroupId("");
    setRoleId("");
    setCommunityId("");
    setErrors({});
  }, []);

  useEffect(() => {
    if (!open) return;
    reset();
    Promise.all([listGroups(), listRoles(), listCommunities()])
      .then(([g, r, c]) => {
        setGroups(g.filter((x) => x.is_active));
        setRoles(r.filter((x) => x.is_active));
        setCommunities(c.filter((x) => x.is_active));
      })
      .catch(() => toast.error("Failed to load groups/roles/communities."));
  }, [open, reset]);

  const selectedRole = roles.find((r) => String(r.id) === roleId);
  const isSuperAdminRole = selectedRole?.code === "super_admin";

  async function handleSave() {
    const e: Record<string, string[]> = {};
    if (!PHONE_RE.test(phone)) e.phone_number = ["Use format 256XXXXXXXXX — 12 digits, no spaces."];
    if (password !== passwordConfirm) e.password_confirm = ["Passwords do not match."];
    if (mode === "group" && !groupId) e.group = ["Choose a group."];
    if (mode === "groupless" && !roleId) e.role = ["Choose a role."];
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const res = await adminRegisterMember({
        phone_number: phone,
        first_name: firstName,
        last_name: lastName,
        email: email.trim() || undefined,
        password,
        password_confirm: passwordConfirm,
        ...(mode === "group"
          ? { group: Number(groupId) }
          : { role: Number(roleId), community: communityId ? Number(communityId) : undefined }),
      });
      toast.success(res.message);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) setErrors(error.fieldErrors);
        else toast.error(error.message);
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    PHONE_RE.test(phone) &&
    firstName.trim() &&
    lastName.trim() &&
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    (mode === "group" ? !!groupId : !!roleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            They log in with this phone number and the temporary password, then must set their own.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "group" | "groupless")}>
          <TabsList className="w-full">
            <TabsTrigger value="groupless" className="flex-1">
              No group (role-based)
            </TabsTrigger>
            <TabsTrigger value="group" className="flex-1">
              Group member
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-4 py-2">
          {mode === "groupless" ? (
            <>
              <Field data-invalid={!!errors.role}>
                <FieldLabel htmlFor="u-role">Role</FieldLabel>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger id="u-role" aria-invalid={!!errors.role}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <FieldError errors={errors.role.map((m) => ({ message: m }))} />}
              </Field>

              {!isSuperAdminRole && (
                <Field data-invalid={!!errors.community}>
                  <FieldLabel htmlFor="u-community">Community (optional)</FieldLabel>
                  <Select value={communityId} onValueChange={setCommunityId}>
                    <SelectTrigger id="u-community" aria-invalid={!!errors.community}>
                      <SelectValue placeholder="No specific community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.community && <FieldError errors={errors.community.map((m) => ({ message: m }))} />}
                </Field>
              )}
            </>
          ) : (
            <Field data-invalid={!!errors.group}>
              <FieldLabel htmlFor="u-group">Group</FieldLabel>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="u-group" aria-invalid={!!errors.group}>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.group && <FieldError errors={errors.group.map((m) => ({ message: m }))} />}
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.first_name}>
              <FieldLabel htmlFor="u-first">Given name</FieldLabel>
              <Input
                id="u-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-invalid={!!errors.first_name}
              />
              {errors.first_name && <FieldError errors={errors.first_name.map((m) => ({ message: m }))} />}
            </Field>
            <Field data-invalid={!!errors.last_name}>
              <FieldLabel htmlFor="u-last">Surname</FieldLabel>
              <Input
                id="u-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-invalid={!!errors.last_name}
              />
              {errors.last_name && <FieldError errors={errors.last_name.map((m) => ({ message: m }))} />}
            </Field>
          </div>

          <Field data-invalid={!!errors.phone_number}>
            <FieldLabel htmlFor="u-phone">Phone number</FieldLabel>
            <Input
              id="u-phone"
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
            <FieldLabel htmlFor="u-email">Email (optional)</FieldLabel>
            <Input
              id="u-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && <FieldError errors={errors.email.map((m) => ({ message: m }))} />}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="u-pass">Temporary password</FieldLabel>
              <Input
                id="u-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
              />
              {errors.password && <FieldError errors={errors.password.map((m) => ({ message: m }))} />}
            </Field>
            <Field data-invalid={!!errors.password_confirm}>
              <FieldLabel htmlFor="u-pass2">Confirm password</FieldLabel>
              <Input
                id="u-pass2"
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
            Add user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
