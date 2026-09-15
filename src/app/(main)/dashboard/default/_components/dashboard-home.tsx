"use client";

// Dashboard home. One request to /api/dashboard/stats/ returns a
// role-aware payload; we render a different layout per scope.

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  Building2,
  Crown,
  Globe,
  KeyRound,
  Loader2,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { type DashboardStats, getDashboardStats } from "@/lib/api/dashboard";
import type { AppUser } from "@/lib/api/users";
import { getStoredUser } from "@/lib/auth/auth-storage";

import { StatCard } from "./stat-card";

function fullName(u: AppUser) {
  return `${u.first_name} ${u.last_name}`.trim() || u.phone_number;
}

function RecentMembers({ members }: { members: AppUser[] }) {
  if (members.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently added</CardTitle>
        <CardDescription>The newest people registered.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Password</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{fullName(m)}</TableCell>
                <TableCell>{m.phone_number}</TableCell>
                <TableCell>{m.group_name ?? "—"}</TableCell>
                <TableCell>
                  {m.must_change_password ? (
                    <Badge variant="outline">Pending</Badge>
                  ) : (
                    <Badge variant="secondary">Set</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const me = getStoredUser();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await getDashboardStats());
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const greeting = me?.first_name ? `Welcome back, ${me.first_name}` : "Welcome back";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  if (!stats) return null;

  // ---------------------------------------------------- Super admin
  if (stats.scope === "super_admin") {
    const c = stats.counts;
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-semibold text-2xl">{greeting}</h1>
          <p className="text-muted-foreground">Platform overview.</p>
        </div>

        {c.groups_without_leader > 0 && (
          <Card className="border-primary/40">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div className="flex items-center gap-3">
                <TriangleAlert className="size-5 text-primary" />
                <div>
                  <p className="font-medium">
                    {c.groups_without_leader} group{c.groups_without_leader > 1 ? "s" : ""} without a leader
                  </p>
                  <p className="text-muted-foreground text-sm">Register a leader so they can start adding members.</p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/leaders">
                  <UserPlus className="size-4" />
                  Register leader
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Members" value={c.members} icon={Users} highlight />
          <StatCard label="Group leaders" value={c.leaders} icon={Crown} tone="amber" />
          <StatCard label="Groups" value={c.groups} icon={UsersRound} tone="blue" />
          <StatCard
            label="Pending password"
            value={c.pending_password}
            icon={KeyRound}
            hint="Not yet set their own"
            tone="rose"
          />
          <StatCard label="Communities" value={c.communities} icon={Building2} tone="teal" />
          <StatCard label="National parks" value={c.parks} icon={MapPin} tone="green" />
          <StatCard label="Countries" value={c.countries} icon={Globe} tone="violet" />
          <StatCard label="Roles" value={c.roles} icon={ShieldCheck} tone="blue" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Members by role</CardTitle>
            <CardDescription>How people are distributed across worker categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {stats.members_by_role.map((r) => {
                const max = Math.max(...stats.members_by_role.map((x) => x.count), 1);
                const pct = Math.round((r.count / max) * 100);
                return (
                  <div key={r.role} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-sm">{r.role}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-muted-foreground text-sm tabular-nums">{r.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <RecentMembers members={stats.recent_members} />
      </div>
    );
  }

  // ---------------------------------------------------- Leader
  if (stats.scope === "leader") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-semibold text-2xl">{greeting}</h1>
          <p className="text-muted-foreground">
            You lead <span className="font-medium">{stats.group.name}</span> · {stats.group.role} ·{" "}
            {stats.group.community}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Members in your group" value={stats.counts.members} icon={Users} highlight />
          <StatCard
            label="Pending password"
            value={stats.counts.pending_password}
            icon={KeyRound}
            hint="Still on a temporary password"
            tone="rose"
          />
          <Card>
            <CardContent className="flex h-full flex-col justify-center gap-2 pt-6">
              <p className="text-muted-foreground text-sm">Manage your group</p>
              <Button asChild size="sm" className="w-fit">
                <Link href="/dashboard/my-group">
                  <UserPlus className="size-4" />
                  Register a member
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <RecentMembers members={stats.recent_members} />
      </div>
    );
  }

  // ---------------------------------------------------- Member
  if (stats.scope === "member") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-semibold text-2xl">{greeting}</h1>
          <p className="text-muted-foreground">Your group and profile.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Your group" value={stats.group.name} icon={UsersRound} highlight />
          <StatCard label="Your role" value={stats.group.role} icon={ShieldCheck} tone="blue" />
          <StatCard label="Members in group" value={stats.counts.members} icon={Users} tone="amber" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Where you work</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Community</span>
              <span className="font-medium">{stats.group.community}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">National park</span>
              <span className="font-medium">{stats.group.park}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{me?.phone_number ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------- No group
  return (
    <Card>
      <CardHeader>
        <CardTitle>{greeting}</CardTitle>
        <CardDescription>You are not assigned to a group yet. Contact your administrator.</CardDescription>
      </CardHeader>
    </Card>
  );
}
