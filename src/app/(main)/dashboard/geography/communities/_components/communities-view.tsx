"use client";

// Communities CRUD screen. Same blueprint; parent is a national park.
// Filter by park; columns show park and country for context.

import { useCallback, useEffect, useState } from "react";

import { Loader2, Pencil, Plus, Power } from "lucide-react";
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
import { ApiError } from "@/lib/api/client";
import {
  type Community,
  deactivateCommunity,
  listCommunities,
  listParks,
  type NationalPark,
} from "@/lib/api/geography";

import { CommunityDialog } from "./community-dialog";

const ALL = "all";

export function CommunitiesView() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [parks, setParks] = useState<NationalPark[]>([]);
  const [filterPark, setFilterPark] = useState<string>(ALL);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Community | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Community | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const parkId = filterPark === ALL ? undefined : Number(filterPark);
      const [communityList, parkList] = await Promise.all([listCommunities(parkId), listParks()]);
      setCommunities(communityList);
      setParks(parkList);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load communities.");
    } finally {
      setLoading(false);
    }
  }, [filterPark]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(community: Community) {
    setEditing(community);
    setDialogOpen(true);
  }

  async function confirmDeactivate() {
    if (!toDeactivate) return;
    setWorking(true);
    try {
      await deactivateCommunity(toDeactivate.id);
      toast.success(`Deactivated ${toDeactivate.name}.`);
      setToDeactivate(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to deactivate.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communities</CardTitle>
        <CardDescription>Communities grouped under their national park.</CardDescription>
        <CardAction>
          <Button onClick={openCreate} disabled={parks.filter((p) => p.is_active).length === 0}>
            <Plus className="size-4" />
            Add community
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter by park:</span>
          <Select value={filterPark} onValueChange={setFilterPark}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All parks</SelectItem>
              {parks.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading...
          </div>
        ) : communities.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No communities yet. Click “Add community” to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Park</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {communities.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.park_name}</TableCell>
                  <TableCell>{c.country_name}</TableCell>
                  <TableCell>{c.group_count}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      {c.is_active && (
                        <Button variant="ghost" size="icon" onClick={() => setToDeactivate(c)} title="Deactivate">
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

      <CommunityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        community={editing}
        parks={parks}
        onSaved={load}
      />

      <AlertDialog open={!!toDeactivate} onOpenChange={(o) => !o && setToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {toDeactivate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be hidden from selection lists but its data and history are kept. You can reactivate it later by
              editing it.
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
