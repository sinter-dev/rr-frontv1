"use client";

// Super admin's group members screen (detail of one group). Reached from
// the Groups list. Shows the roster, lets the admin add members directly
// (even if leaderless) and promote any member to leader.

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { ArrowLeft, Crown, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { RegisterMemberDialog } from "@/app/(main)/dashboard/my-group/_components/register-member-dialog";
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
import { type Group, listGroups } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import {
  type AppUser,
  adminRegisterMember,
  listGroupMembers,
  type RegisterMemberInput,
  setGroupLeader,
} from "@/lib/api/users";

interface Props {
  groupId: number;
}

export function GroupMembersView({ groupId }: Props) {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toPromote, setToPromote] = useState<AppUser | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // no single-group GET endpoint; find it in the list (small dataset)
      const [memberList, groups] = await Promise.all([listGroupMembers(groupId), listGroups()]);
      setMembers(memberList);
      setGroup(groups.find((g) => g.id === groupId) ?? null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load group members.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRegister(data: RegisterMemberInput) {
    const res = await adminRegisterMember({ ...data, group: groupId });
    toast.success(res.message);
  }

  async function confirmPromote() {
    if (!toPromote) return;
    setWorking(true);
    try {
      await setGroupLeader(groupId, toPromote.id);
      toast.success(`${toPromote.first_name || toPromote.phone_number} is now the group leader.`);
      setToPromote(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to change leader.");
    } finally {
      setWorking(false);
    }
  }

  const leaderId = group?.leader ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/dashboard/groups">
          <ArrowLeft className="size-4" />
          Back to groups
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{group ? group.name : "Group members"}</CardTitle>
          <CardDescription>
            {group ? `${group.role_name} · ${group.community_name}` : "Members of this group."}
          </CardDescription>
          <CardAction>
            <Button onClick={() => setDialogOpen(true)} disabled={!group?.is_active}>
              <Plus className="size-4" />
              Add member
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
              No members yet. Click “Add member” to add the first one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role in group</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const fullName = `${m.first_name} ${m.last_name}`.trim() || "—";
                  const isLeader = m.id === leaderId;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{fullName}</TableCell>
                      <TableCell>{m.phone_number}</TableCell>
                      <TableCell>
                        {isLeader ? <Badge>Leader</Badge> : <Badge variant="secondary">Member</Badge>}
                      </TableCell>
                      <TableCell>
                        {m.must_change_password ? (
                          <Badge variant="outline">Pending change</Badge>
                        ) : (
                          <Badge variant="secondary">Set</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isLeader && (
                          <Button variant="ghost" size="sm" onClick={() => setToPromote(m)}>
                            <Crown className="size-4" />
                            Make leader
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RegisterMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleRegister}
        onSaved={load}
        contextLabel={group?.name}
      />

      <AlertDialog open={!!toPromote} onOpenChange={(o) => !o && setToPromote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make {toPromote?.first_name || toPromote?.phone_number} the leader?</AlertDialogTitle>
            <AlertDialogDescription>
              The current leader (if any) becomes an ordinary member. The new leader can register members and hand over
              leadership themselves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmPromote()} disabled={working}>
              {working && <Loader2 className="size-4 animate-spin" />}
              Make leader
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
