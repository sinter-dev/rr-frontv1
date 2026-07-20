"use client";

// Leader's "My Group" screen. Lists the leader's own group members,
// registers new ones, edits member details, and can promote a member to
// leader. Because of Option A, promoting someone DEMOTES the current
// leader — so we warn clearly and, after promotion, send them to the
// dashboard (they lose access to this leader-only screen).

import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Crown, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { EditUserDialog } from "@/app/(main)/dashboard/_components/shared/edit-user-dialog";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { type AppUser, listMyMembers, type RegisterMemberInput, registerMember, setGroupLeader } from "@/lib/api/users";
import { getStoredUser } from "@/lib/auth/auth-storage";

import { RegisterMemberDialog } from "./register-member-dialog";

export function MyGroupView() {
  const router = useRouter();
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [toPromote, setToPromote] = useState<AppUser | null>(null);
  const [working, setWorking] = useState(false);

  const me = getStoredUser();
  const groupId = me?.group ?? null;
  const groupName = me?.group_name ?? "your group";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await listMyMembers());
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRegister(data: RegisterMemberInput) {
    const res = await registerMember(data);
    toast.success(res.message);
  }

  async function confirmPromote() {
    if (!toPromote || !groupId) return;
    setWorking(true);
    try {
      await setGroupLeader(groupId, toPromote.id);
      toast.success(`${toPromote.first_name || toPromote.phone_number} is now the group leader.`);
      // The current user just demoted themselves — their session profile is
      // stale. Send them to the dashboard, where the sidebar will reflect
      // their new (member) permissions.
      router.replace("/dashboard/default");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to change leader.");
      setWorking(false);
      setToPromote(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Group — {groupName}</CardTitle>
        <CardDescription>
          Members of your group. You can add members, correct their details, or hand over leadership.
        </CardDescription>
        <CardAction>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Register member
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading...
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No members yet. Click “Register member” to add the first one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const fullName = `${m.first_name} ${m.last_name}`.trim() || "—";
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{fullName}</TableCell>
                    <TableCell>{m.phone_number}</TableCell>
                    <TableCell>
                      {m.must_change_password ? (
                        <Badge variant="outline">Pending change</Badge>
                      ) : (
                        <Badge variant="secondary">Set</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(m)} title="Edit details">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setToPromote(m)}>
                          <Crown className="size-4" />
                          Make leader
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <RegisterMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleRegister}
        onSaved={load}
        contextLabel={groupName}
      />

      <EditUserDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        user={editing}
        mode="leader"
        onSaved={load}
      />

      <AlertDialog open={!!toPromote} onOpenChange={(o) => !o && setToPromote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make {toPromote?.first_name || toPromote?.phone_number} the leader?</AlertDialogTitle>
            <AlertDialogDescription>
              You will hand over leadership and become an ordinary member. You’ll lose access to leader-only actions
              immediately. This cannot be undone by you afterwards — only the new leader or an admin can change it back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmPromote()} disabled={working}>
              {working && <Loader2 className="size-4 animate-spin" />}
              Yes, hand over leadership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
