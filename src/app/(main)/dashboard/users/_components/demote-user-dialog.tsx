"use client";

// Demote a super admin back to a normal role, picked explicitly by the
// admin — never a default guess. Self-demotion is blocked server-side;
// this dialog simply won't be opened for the logged-in admin's own row
// (see all-users-view.tsx).

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
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listRoles, type Role } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { type Community, listCommunities } from "@/lib/api/geography";
import { type AppUser, demoteSuperAdmin } from "@/lib/api/users";

interface Props {
  user: AppUser | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function DemoteUserDialog({ user, onOpenChange, onSaved }: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [roleId, setRoleId] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setRoleId("");
    setCommunityId("");
    setError(null);
    Promise.all([listRoles(), listCommunities()])
      .then(([r, c]) => {
        setRoles(r.filter((x) => x.is_active && x.code !== "super_admin"));
        setCommunities(c.filter((x) => x.is_active));
      })
      .catch(() => toast.error("Failed to load roles/communities."));
  }, [user]);

  async function handleSave() {
    if (!user || !roleId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await demoteSuperAdmin(user.id, {
        role: Number(roleId),
        community: communityId ? Number(communityId) : undefined,
      });
      toast.success(res.message);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demote {user?.first_name}</DialogTitle>
          <DialogDescription>
            Choose the role they'll have instead. Their super admin access is revoked immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Field>
            <FieldLabel htmlFor="d-role">New role</FieldLabel>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger id="d-role">
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
          </Field>

          <Field>
            <FieldLabel htmlFor="d-community">Community (optional)</FieldLabel>
            <Select value={communityId} onValueChange={setCommunityId}>
              <SelectTrigger id="d-community">
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
          </Field>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !roleId}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Demote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
