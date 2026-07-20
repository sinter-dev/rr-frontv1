"use client";

// Group create/edit dialog. Two parent <Select>s: community and role,
// plus the self-chosen group name (e.g. "Twegombe Porters"). The super
// admin role is never offered (backend rejects it too).

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createGroup, type Group, type Role, updateGroup } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import type { Community } from "@/lib/api/geography";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  communities: Community[];
  roles: Role[];
  onSaved: () => void;
}

export function GroupDialog({ open, onOpenChange, group, communities, roles, onSaved }: Props) {
  const isEdit = group !== null;
  const [name, setName] = useState("");
  const [communityId, setCommunityId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setName(group?.name ?? "");
      setCommunityId(group ? String(group.community) : "");
      setRoleId(group ? String(group.role) : "");
      setIsActive(group?.is_active ?? true);
      setErrors({});
    }
  }, [open, group]);

  async function handleSave() {
    setSaving(true);
    setErrors({});
    try {
      if (isEdit) {
        await updateGroup(group.id, {
          name,
          community: Number(communityId),
          role: Number(roleId),
          is_active: isActive,
        });
        toast.success(`Updated ${name}.`);
      } else {
        await createGroup({ name, community: Number(communityId), role: Number(roleId) });
        toast.success(`Created ${name}.`);
      }
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

  const communityOptions = isEdit ? communities : communities.filter((c) => c.is_active);
  // never offer the super admin role for a group
  const roleOptions = roles.filter((r) => r.code !== "super_admin" && (isEdit || r.is_active));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit group" : "Add group"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the group details."
              : "A named team of one role within a community, e.g. “Twegombe Porters”."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Field data-invalid={!!errors.community}>
            <FieldLabel htmlFor="group-community">Community</FieldLabel>
            <Select value={communityId} onValueChange={setCommunityId}>
              <SelectTrigger id="group-community" aria-invalid={!!errors.community}>
                <SelectValue placeholder="Select a community" />
              </SelectTrigger>
              <SelectContent>
                {communityOptions.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} · {c.park_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.community && <FieldError errors={errors.community.map((m) => ({ message: m }))} />}
          </Field>

          <Field data-invalid={!!errors.role}>
            <FieldLabel htmlFor="group-role">Role</FieldLabel>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger id="group-role" aria-invalid={!!errors.role}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <FieldError errors={errors.role.map((m) => ({ message: m }))} />}
          </Field>

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="group-name">Group name</FieldLabel>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Twegombe Porters"
              aria-invalid={!!errors.name}
            />
            {errors.name && <FieldError errors={errors.name.map((m) => ({ message: m }))} />}
          </Field>

          {isEdit && (
            <Field orientation="horizontal">
              <Switch id="group-active" checked={isActive} onCheckedChange={setIsActive} />
              <FieldLabel htmlFor="group-active">Active</FieldLabel>
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !name.trim() || !communityId || !roleId}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
