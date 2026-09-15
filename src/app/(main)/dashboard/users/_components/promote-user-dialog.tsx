"use client";

// Confirmation for promoting an existing user to Super Admin. Explains
// the consequence plainly — removed from their group, given full access
// — and calls out the leader-orphan case specifically if it applies,
// since that's the one surprise this action could otherwise cause.

import { useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError } from "@/lib/api/client";
import type { AppUser } from "@/lib/api/users";
import { promoteToSuperAdmin } from "@/lib/api/users";

interface Props {
  user: AppUser | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function PromoteUserDialog({ user, onOpenChange, onSaved }: Props) {
  const [working, setWorking] = useState(false);

  async function confirm() {
    if (!user) return;
    setWorking(true);
    try {
      const res = await promoteToSuperAdmin(user.id);
      toast.success(res.message);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <AlertDialog open={!!user} onOpenChange={(o) => !o && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Promote {user?.first_name} to Super Admin?</AlertDialogTitle>
          <AlertDialogDescription>
            {user?.group_name
              ? `They'll be removed from ${user.group_name} and given full platform access.`
              : "They'll be given full platform access."}{" "}
            This can be reversed later by demoting them back to a specific role.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void confirm()} disabled={working}>
            {working && <Loader2 className="size-4 animate-spin" />}
            Promote
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
