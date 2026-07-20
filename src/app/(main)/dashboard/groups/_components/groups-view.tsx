"use client";

// Groups CRUD screen. Combines geography (communities) and accounts
// (roles) data. Shows each group's role, community, member count, and
// whether it has a leader yet — the cue for the next screen (registering
// leaders into leaderless groups).

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { Loader2, Pencil, Plus, Power, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deactivateGroup, type Group, listGroups, listRoles, type Role } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { type Community, listCommunities } from "@/lib/api/geography";

import { GroupDialog } from "./group-dialog";

const ALL = "all";

export function GroupsView() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filterCommunity, setFilterCommunity] = useState<string>(ALL);
  const [filterRole, setFilterRole] = useState<string>(ALL);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Group | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [groupList, communityList, roleList] = await Promise.all([
        listGroups({
          community: filterCommunity === ALL ? undefined : Number(filterCommunity),
          role: filterRole === ALL ? undefined : filterRole,
        }),
        listCommunities(),
        listRoles(),
      ]);
      setGroups(groupList);
      setCommunities(communityList);
      setRoles(roleList);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load groups.");
    } finally {
      setLoading(false);
    }
  }, [filterCommunity, filterRole]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(group: Group) {
    setEditing(group);
    setDialogOpen(true);
  }

  async function confirmDeactivate() {
    if (!toDeactivate) return;
    setWorking(true);
    try {
      await deactivateGroup(toDeactivate.id);
      toast.success(`Deactivated ${toDeactivate.name}.`);
      setToDeactivate(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to deactivate.");
    } finally {
      setWorking(false);
    }
  }

  const canCreate =
    communities.filter((c) => c.is_active).length > 0 &&
    roles.filter((r) => r.code !== "super_admin" && r.is_active).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Groups</CardTitle>
        <CardDescription>Named teams of a role within a community.</CardDescription>
        <CardAction>
          <Button onClick={openCreate} disabled={!canCreate}>
            <Plus className="size-4" />
            Add group
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Community:</span>
            <Select value={filterCommunity} onValueChange={setFilterCommunity}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All communities</SelectItem>
                {communities.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Role:</span>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All roles</SelectItem>
                {roles
                  .filter((r) => r.code !== "super_admin")
                  .map((r) => (
                    <SelectItem key={r.id} value={r.code}>
                      {r.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading...
          </div>
        ) : groups.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">No groups yet. Click “Add group” to create one.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Community</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell>{g.role_name}</TableCell>
                  <TableCell>{g.community_name}</TableCell>
                  <TableCell>{g.member_count}</TableCell>
                  <TableCell>{g.leader_phone ? g.leader_phone : <Badge variant="outline">No leader</Badge>}</TableCell>
                  <TableCell>
                    <Badge variant={g.is_active ? "default" : "secondary"}>{g.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* ///// */}
                      <Button variant="ghost" size="icon" asChild title="Members">
                        <Link href={`/dashboard/groups/${g.id}`}>
                          <Users className="size-4" />
                        </Link>
                      </Button>
                      {/* ///// */}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(g)} title="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      {g.is_active && (
                        <Button variant="ghost" size="icon" onClick={() => setToDeactivate(g)} title="Deactivate">
                          <Power className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <GroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        group={editing}
        communities={communities}
        roles={roles}
        onSaved={load}
      />

      <AlertDialog open={!!toDeactivate} onOpenChange={(o) => !o && setToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {toDeactivate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Groups with members cannot be deactivated. If empty, it will be hidden from selection lists but its
              history is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeactivate()} disabled={working}>
              {working && <Loader2 className="size-4 animate-spin" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
