"use client";

// Countries CRUD screen (client component).
// This is the TEMPLATE we replicate for Parks, Communities, Groups, etc.:
//   load on mount -> table -> create/edit dialog -> deactivate confirm.

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { type Country, deactivateCountry, listCountries } from "@/lib/api/geography";

import { CountryDialog } from "./country-dialog";

export function CountriesView() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Country | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCountries(await listCountries());
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load countries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(country: Country) {
    setEditing(country);
    setDialogOpen(true);
  }

  async function confirmDeactivate() {
    if (!toDeactivate) return;
    setWorking(true);
    try {
      await deactivateCountry(toDeactivate.id);
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
        <CardTitle>Countries</CardTitle>
        <CardDescription>Manage the countries your parks belong to.</CardDescription>
        <CardAction>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add country
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading...
          </div>
        ) : countries.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No countries yet. Click “Add country” to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Parks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countries.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.code || "—"}</TableCell>
                  <TableCell>{c.park_count}</TableCell>
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

      <CountryDialog open={dialogOpen} onOpenChange={setDialogOpen} country={editing} onSaved={load} />

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
            <AlertDialogAction onClick={confirmDeactivate} disabled={working}>
              {working && <Loader2 className="size-4 animate-spin" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
