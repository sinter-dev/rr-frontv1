"use client";

// National Parks CRUD screen. Same blueprint as Countries, plus:
// - loads countries too (for the dialog's parent select and the filter)
// - a country filter dropdown above the table
// - a Country column

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
import { type Country, deactivatePark, listCountries, listParks, type NationalPark } from "@/lib/api/geography";

import { ParkDialog } from "./park-dialog";

const ALL = "all";

export function ParksView() {
  const [parks, setParks] = useState<NationalPark[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [filterCountry, setFilterCountry] = useState<string>(ALL);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NationalPark | null>(null);
  const [toDeactivate, setToDeactivate] = useState<NationalPark | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const countryId = filterCountry === ALL ? undefined : Number(filterCountry);
      const [parkList, countryList] = await Promise.all([listParks(countryId), listCountries()]);
      setParks(parkList);
      setCountries(countryList);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load parks.");
    } finally {
      setLoading(false);
    }
  }, [filterCountry]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(park: NationalPark) {
    setEditing(park);
    setDialogOpen(true);
  }

  async function confirmDeactivate() {
    if (!toDeactivate) return;
    setWorking(true);
    try {
      await deactivatePark(toDeactivate.id);
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
        <CardTitle>National Parks</CardTitle>
        <CardDescription>Parks grouped under their country.</CardDescription>
        <CardAction>
          <Button onClick={openCreate} disabled={countries.filter((c) => c.is_active).length === 0}>
            <Plus className="size-4" />
            Add park
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter by country:</span>
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
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
        ) : parks.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">No parks yet. Click “Add park” to create one.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Communities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parks.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.country_name}</TableCell>
                  <TableCell>{p.community_count}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      {p.is_active && (
                        <Button variant="ghost" size="icon" onClick={() => setToDeactivate(p)} title="Deactivate">
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

      <ParkDialog open={dialogOpen} onOpenChange={setDialogOpen} park={editing} countries={countries} onSaved={load} />

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
