"use client";

// Craft Categories CRUD screen (client component). Structurally identical
// to CountriesView — load on mount -> table -> create/edit dialog ->
// deactivate confirm.

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
import { type Category, deactivateCategory, listCategories } from "@/lib/api/marketplace";

import { CategoryDialog } from "./category-dialog";

export function CategoriesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Category | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await listCategories());
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load categories.");
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

  function openEdit(category: Category) {
    setEditing(category);
    setDialogOpen(true);
  }

  async function confirmDeactivate() {
    if (!toDeactivate) return;
    setWorking(true);
    try {
      await deactivateCategory(toDeactivate.id);
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
        <CardTitle>Craft Categories</CardTitle>
        <CardDescription>Manage the categories craft sellers choose from when listing a product.</CardDescription>
        <CardAction>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add category
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No categories yet. Click "Add category" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.product_count}</TableCell>
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

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} onSaved={load} />

      <AlertDialog open={!!toDeactivate} onOpenChange={(o) => !o && setToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {toDeactivate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDeactivate && toDeactivate.product_count > 0
                ? `${toDeactivate.product_count} product(s) currently use this category. They'll keep working, but sellers won't be able to pick this category for NEW products until it's reactivated.`
                : "It will be hidden from the seller's dropdown. You can reactivate it later by editing it."}
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
