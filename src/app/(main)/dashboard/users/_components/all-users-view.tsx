"use client";

// "All Users" — every user in the system, grouped or not. Search,
// filter by role and groupless-only, paginated (client-side — the
// backend endpoint isn't itself paginated, so we fetch the filtered set
// and slice it for display).

import { useCallback, useEffect, useState } from "react";

import { Loader2, MoreVertical, Pencil, Plus, Search, ShieldMinus, ShieldPlus } from "lucide-react";
import { toast } from "sonner";

import { EditUserDialog } from "@/app/(main)/dashboard/_components/shared/edit-user-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthUser } from "@/hooks/use-auth-user";
import { listRoles, type Role } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { type AppUser, listAllUsers } from "@/lib/api/users";

import { AddUserDialog } from "./add-user-dialog";
import { DemoteUserDialog } from "./demote-user-dialog";
import { PromoteUserDialog } from "./promote-user-dialog";

const PAGE_SIZE = 15;

export function AllUsersView() {
  const currentUser = useAuthUser();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [promotingUser, setPromotingUser] = useState<AppUser | null>(null);
  const [demotingUser, setDemotingUser] = useState<AppUser | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [grouplessOnly, setGrouplessOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    listRoles()
      .then(setRoles)
      .catch(() => toast.error("Failed to load roles."));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const u = await listAllUsers({
        search: search || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        groupless: grouplessOnly || undefined,
      });
      setUsers(u);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, grouplessOnly]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300); // debounce search
    return () => clearTimeout(timer);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pageUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>Every user in the system — grouped workers, freelancers, and staff.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or phone"
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.code}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                id="groupless-only"
                checked={grouplessOnly}
                onCheckedChange={(v) => {
                  setGrouplessOnly(v);
                  setPage(1);
                }}
              />
              <label htmlFor="groupless-only" className="text-muted-foreground text-sm">
                Groupless only
              </label>
            </div>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add user
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">No users match your filters.</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Group / Community</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.first_name} {u.last_name}
                    </TableCell>
                    <TableCell>{u.phone_number}</TableCell>
                    <TableCell>
                      {u.role ? (
                        <Badge variant={u.role.code === "super_admin" ? "default" : "secondary"}>{u.role.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.group_name ?? u.community?.name ?? "—"}
                      {!u.group_name && u.community && <span className="ml-1 text-xs">(groupless)</span>}
                    </TableCell>
                    <TableCell>
                      {u.must_change_password ? (
                        <Badge variant="outline">Pending first login</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(u)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          {u.role?.code === "super_admin" ? (
                            u.id !== currentUser?.id && (
                              <DropdownMenuItem onClick={() => setDemotingUser(u)}>
                                <ShieldMinus className="size-4" />
                                Demote
                              </DropdownMenuItem>
                            )
                          ) : (
                            <DropdownMenuItem onClick={() => setPromotingUser(u)}>
                              <ShieldPlus className="size-4" />
                              Promote to Super Admin
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <Pagination className="mt-4 justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="cursor-pointer">
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onSaved={load} />
      <EditUserDialog
        open={!!editingUser}
        onOpenChange={(o) => !o && setEditingUser(null)}
        user={editingUser}
        mode="admin"
        onSaved={load}
      />
      <PromoteUserDialog user={promotingUser} onOpenChange={() => setPromotingUser(null)} onSaved={load} />
      <DemoteUserDialog user={demotingUser} onOpenChange={() => setDemotingUser(null)} onSaved={load} />
    </Card>
  );
}
